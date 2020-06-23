---
title: 从Chrome源码看JS Array的底层实现
date: 2020-06-17 22:41:59
tags:
  - array
categories:
  - Chrome源码
---

作为前端er，我们都知道，JS 的数组可以存放不同类型的元素、并且数组长度是可变的。不像其他的语言，比如C，创建的时候要决定数组的大小，如果数组满了，就要重新申请内存空间。

知道归知道，但是要想弄清楚其中原因，就得从Chrome源码去探究了。

<!-- more -->

### JS Array为什么可以保存不同类型

先看下Chrome V8对JSArray的定义：
```C++
// The JSArray describes JavaScript Arrays
//  Such an array can be in one of two modes:
//    - fast, backing storage is a FixedArray and length <= elements.length();
//       Please note: push and pop can be used to grow and shrink the array.
//    - slow, backing storage is a HashTable with numbers as keys.
class JSArray: public JSObject {
 public:
  // [length]: The length property.
  DECL_ACCESSORS(length, Object)

  // ...

  // Number of element slots to pre-allocate for an empty array.
  static const int kPreallocatedArrayElements = 4;
};
```

我们可以看到 JSArray 是继承自 JSObject 的，所以在 JavaScript 中，数组可以是一个特殊的对象，内部是以 key-value 形式存储数据，所以 JavaScript 中的数组可以存放不同类型的值。

### JS Array如何存储

从上述 V8 源码注释中可以看出，JSArray有两种存储方式：

- fast：存储结构是 FixedArray ，并且数组长度 <= elements.length() ，push 或 pop 时可能会伴随着动态扩容或减容，源码里叫 `FastElements`;
- slow：存储结构是 HashTable，并且数组下标作为 key,源码里叫 `SlowElements`;

1. 快数组（FastElements）
FixedArray 是 V8 实现的一个类似于数组的类，它表示一段连续的内存，可以使用索引直接定位。新创建的空数组默认就是快数组。当数组满（数组的长度达到数组在内存中申请的内存容量最大值）的时候，继续 push 时， JSArray 会进行动态的扩容，以存储更多的元素。

2. 慢数组（SlowElements）
慢数组以哈希表的形式存储在内存空间里，它不需要开辟连续的存储空间,节省了内存，但需要额外维护一个哈希表，性能相对较差。

3. 什么时候会从 fast 转变为 slow

```C++
// src/objects/js-objects.h
static const uint32_t kMaxGap = 1024;

// src/objects/dictionary.h
// JSObjects prefer dictionary elements if the dictionary saves this much
// memory compared to a fast elements backing store.
static const uint32_t kPreferFastElementsSizeFactor = 3;

// src/objects/js-objects-inl.h
// If the fast-case backing storage takes up much more memory than a dictionary
// backing storage would, the object should have slow elements.
// static
static inline bool ShouldConvertToSlowElements(uint32_t used_elements,
                                               uint32_t new_capacity) {
  uint32_t size_threshold = NumberDictionary::kPreferFastElementsSizeFactor *
                            NumberDictionary::ComputeCapacity(used_elements) *
                            NumberDictionary::kEntrySize;
  // 快数组新容量是扩容后的容量3倍之多时，也会被转成慢数组
  return size_threshold <= new_capacity;
}

static inline bool ShouldConvertToSlowElements(JSObject object,
                                               uint32_t capacity,
                                               uint32_t index,
                                               uint32_t* new_capacity) {
  STATIC_ASSERT(JSObject::kMaxUncheckedOldFastElementsLength <=
                JSObject::kMaxUncheckedFastElementsLength);
  if (index < capacity) {
    *new_capacity = capacity;
    return false;
  }
  // 当加入的索引值（例如例3中的2000）比当前容量capacity 大于等于 1024时，
  // 返回true，转为慢数组
  if (index - capacity >= JSObject::kMaxGap) return true;
  *new_capacity = JSObject::NewElementsCapacity(index + 1);
  DCHECK_LT(index, *new_capacity);
  // TODO(ulan): Check if it works with young large objects.
  if (*new_capacity <= JSObject::kMaxUncheckedOldFastElementsLength ||
      (*new_capacity <= JSObject::kMaxUncheckedFastElementsLength &&
       ObjectInYoungGeneration(object))) {
    return false;
  }
  return ShouldConvertToSlowElements(object.GetFastElementsUsage(),
                                     *new_capacity);
}
```

从上述源码看出，当处于以下情况时，快数组会被转变为慢数组：

- 当加入的索引值 index 比当前容量 capacity 差值大于等于 1024 时（index - capacity >= 1024）
- 快数组新容量是扩容后的容量 3 倍之多时

增加一个2000的索引时，array就会被转成慢数组:
```js
var array = [1, 2, 3]
array[2000] = 1000;
```

4. 什么时候会从 slow 转变为 fast

```C++
static bool ShouldConvertToFastElements(JSObject object,
                                        NumberDictionary dictionary,
                                        uint32_t index,
                                        uint32_t* new_capacity) {
  // If properties with non-standard attributes or accessors were added, we
  // cannot go back to fast elements.
  if (dictionary.requires_slow_elements()) return false;
  // Adding a property with this index will require slow elements.
  if (index >= static_cast<uint32_t>(Smi::kMaxValue)) return false;
  if (object.IsJSArray()) {
    Object length = JSArray::cast(object).length();
    if (!length.IsSmi()) return false;
    *new_capacity = static_cast<uint32_t>(Smi::ToInt(length));
  } else if (object.IsJSArgumentsObject()) {
    return false;
  } else {
    *new_capacity = dictionary.max_number_key() + 1;
  }
  *new_capacity = Max(index + 1, *new_capacity);
  uint32_t dictionary_size = static_cast<uint32_t>(dictionary.Capacity()) *
                             NumberDictionary::kEntrySize;
  // Turn fast if the dictionary only saves 50% space.
  return 2 * dictionary_size >= *new_capacity;
}
```

当慢数组的元素可存放在快数组中且长度在 `smi` 之间且仅节省了50%的空间(用慢数组节省的空间不大于50%),则会转变为快数组
> smi在64位平台为-2<sup>31</sup> 到 2<sup>31</sup> -1，在32位平台为-2<sup>30</sup> 到 2<sup>30</sup> -1

```js
let a = [1,2];
a[1030] = 1;
for (let i = 200; i < 1030; i++) {
    a[i] = i;
}
```

在 1030 的位置上面添加一个值，会造成多于 1024 个空洞，数组变成慢数组；
然后往这个数组中 200-1029 这些位置上赋值，使慢数组不再比快数组节省 50% 的空间，则数组变成快数组。

5. 总结

快数组就是以空间换时间的方式，申请了大块连续内存，提高效率。 慢数组以时间换空间，不必申请连续的空间，节省了内存，但需要付出效率变差的代价。


### 数组的动态扩容与减容

默认空数组初始化大小为 4 :
```C++
// Number of element slots to pre-allocate for an empty array.
static const int kPreallocatedArrayElements = 4;
```

在 Chrome 源码中， push 的操作是用汇编实现的，在 c++ 里嵌入的汇编，以提高执行效率，并且在汇编的基础上用 c++ 封装了一层，在编译执行的时候，会将这些 c++ 代码转成汇编代码。

计算新容量的函数：

```C++
// js-objects.h
static const uint32_t kMinAddedElementsCapacity = 16;

// code-stub-assembler.cc
Node* CodeStubAssembler::CalculateNewElementsCapacity(Node* old_capacity,
                                                      ParameterMode mode) {
  CSA_SLOW_ASSERT(this, MatchesParameterMode(old_capacity, mode));
  Node* half_old_capacity = WordOrSmiShr(old_capacity, 1, mode);
  Node* new_capacity = IntPtrOrSmiAdd(half_old_capacity, old_capacity, mode);
  Node* padding =
      IntPtrOrSmiConstant(JSObject::kMinAddedElementsCapacity, mode);
  return IntPtrOrSmiAdd(new_capacity, padding, mode);
}
```

所以扩容后新容量计公式为：

```C++
new_capacity = old_capacity /2 + old_capacity + 16
```

即老的容量的 1.5 倍加上 16 。初始化为 4 个，当 push 第 5 个的时候，容量将会变成：

```C++
new_capacity = 4 / 2 + 4 + 16 = 22
```

接着申请一块这么大的内存，把老的数据拷过去，把新元素放在当前 length 位置，然后将数组的 length + 1，并返回 length。

整个过程，用户是无感知的，不像 C，需用用户手动申请内存空间。

当数组执行 pop 操作时，会判断 pop 后数组的容量，是否需要进行减容。

不同于数组的 push 使用汇编实现的， pop 使用 c++ 实现的。

判断是否进行减容：

```C++
if (2 * length <= capacity) {
  // If more than half the elements won't be used, trim the array.
  isolate->heap()->RightTrimFixedArray(*backing_store, capacity - length);
} else {
  // Otherwise, fill the unused tail with holes.
  BackingStore::cast(*backing_store)->FillWithHoles(length, old_length);
}
```

所以，当数组 pop 后，如果数组容量大于等于 length 的 2 倍，则进行容量调整，使用 RightTrimFixedArray 函数，计算出需要释放的空间大小，做好标记，等待 GC 回收；如果数组容量小于 length 的 2 倍，则用 holes 对象填充。


### 总结

JavaScript 中， JSArray 继承自 JSObject ，是一个特殊的对象，内部是以 key-value 形式存储数据，所以 JavaScript 中的数组可以存放不同类型的值。

JSArray有两种存储方式，快数组与慢数组，初始化空数组时，使用快数组，快数组使用连续的内存空间，当快数组长度达到最大时，JSArray 会进行动态的扩容，以存储更多的元素，相对慢数组，性能要好得多。

当数组中 hole 太多时，会转变成慢数组，即以哈希表的方式（ key-value 的形式）存储数据，以节省内存空间。


### 一道面试题 - 数组扁平化

假如有个数组：
```js
var arr = [ [1, 2, 2], [3, 4, [5, 5]], 10]
```

如何将其扁平化为：

```js
[1, 2, 2, 3, 4, 5, 5, 10]
```

核心思想： 遍历数组arr，若arr[i]为数组则递归遍历，直至arr[i]不为数组然后与之前的结果concat。

1. ES6 flat

```js
arr.flat(Infinity)
```

2. reduce

```js
function flatten(arr) {
    return arr.reduce((result, item)=> {
        return result.concat(Array.isArray(item) ? flatten(item) : item);
    }, []);
}
```

3. toString / join

```js
function flatten(arr) {
    return arr.toString().split(',').map(function(item) {
        return Number(item);
    })
}

```

4. 递归

```js
function flatten(arr) {
    var res = [];
    arr.map(item => {
        if(Array.isArray(item)) {
            res = res.concat(flatten(item));
        } else {
            res.push(item);
        }
    });
    return res;
}
```

5. 扩展运算符

es6的扩展运算符能将二维数组变为一维

```js
function flatten(arr) {
    while(arr.some(item=>Array.isArray(item))) {
        arr = [].concat(...arr);
    }
    return arr;
}
```


参考链接：
[前端进阶算法2：从Chrome V8源码看JavaScript数组](https://github.com/sisterAn/JavaScript-Algorithms/issues/2)

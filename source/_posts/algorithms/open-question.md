---
title: 开放性问题汇总
date: 2024-04-11 11:27:42
tags: 逻辑思维
categories: algorithms
excerpt: 逻辑思维主要考察面试者思考的能力，是否结构化、是否有条理，表达描述是否清晰等。
---

## 一、一次性插入 1000 个 div，如何优化插入的性能

一次性插入 1000 个 `div` 元素到页面上，如果直接操作 DOM，可能会导致页面渲染性能下降，出现卡顿的现象。为了优化插入的性能，可以采用以下几种策略：

### 1. 使用 `DocumentFragment`

`DocumentFragment` 是一个轻量级的虚拟节点容器，可以用来将多个 DOM 元素插入到文档中，而不会导致页面的多次重绘和回流。具体做法是将所有的 `div` 元素先插入到 `DocumentFragment` 中，然后再一次性将这个 `DocumentFragment` 插入到 DOM 中。

```javascript
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
	const div = document.createElement('div');
	div.textContent = `Div ${i}`;
	fragment.appendChild(div);
}
document.body.appendChild(fragment);
```

### 2. 使用 `innerHTML` 批量插入

如果你不需要在插入过程中对每个 `div` 进行复杂操作，可以通过构建一个大的 HTML 字符串，然后一次性插入，这样可以减少多次操作 DOM 的开销。

```javascript
let html = '';
for (let i = 0; i < 1000; i++) {
	html += `<div>Div ${i}</div>`;
}
document.body.innerHTML += html;
```

### 3. 使用 `requestAnimationFrame` 分批插入

如果一次插入 1000 个元素仍然导致页面卡顿，可以考虑使用 `requestAnimationFrame` 将插入操作分批处理。每次插入一部分元素，然后让浏览器有机会渲染页面，减少长时间阻塞主线程的情况。

```javascript
const total = 1000;
const batchSize = 100;
let startIndex = 0;

function insertBatch() {
	const fragment = document.createDocumentFragment();
	for (let i = 0; i < batchSize && startIndex < total; i++, startIndex++) {
		const div = document.createElement('div');
		div.textContent = `Div ${startIndex}`;
		fragment.appendChild(div);
	}
	document.body.appendChild(fragment);
	if (startIndex < total) {
		requestAnimationFrame(insertBatch);
	}
}

insertBatch();
```

### 4. 使用虚拟 DOM（例如 React）

如果你在使用框架（如 React），可以通过虚拟 DOM 来优化批量插入的性能。React 会对 DOM 操作进行优化，减少实际的 DOM 操作次数，从而提高性能。

```javascript
const divs = [];
for (let i = 0; i < 1000; i++) {
	divs.push(<div key={i}>Div {i}</div>);
}
ReactDOM.render(<div>{divs}</div>, document.getElementById('root'));
```

### 5. 使用异步任务 (`setTimeout` 或 `setImmediate`)

类似于 `requestAnimationFrame`，使用 `setTimeout` 或 `setImmediate` 可以分批次执行插入操作，避免一次性阻塞主线程。

```javascript
function insertAsync() {
	let i = 0;
	function insert() {
		const fragment = document.createDocumentFragment();
		for (let j = 0; j < 100 && i < 1000; j++, i++) {
			const div = document.createElement('div');
			div.textContent = `Div ${i}`;
			fragment.appendChild(div);
		}
		document.body.appendChild(fragment);
		if (i < 1000) {
			setTimeout(insert, 0);
		}
	}
	insert();
}
insertAsync();
```

### 6. Web Workers (适用于计算密集型任务)

对于计算密集型任务，可以考虑使用 Web Workers 将计算逻辑移到后台线程，然后在主线程完成插入操作。虽然 Web Workers 不能直接操作 DOM，但它们可以帮助处理复杂逻辑，减少主线程的压力。

### 总结

最推荐的优化方案是使用 `DocumentFragment` 或者 `innerHTML` 来减少 DOM 操作的次数。如果仍然卡顿，可以考虑使用 `requestAnimationFrame` 或 `setTimeout` 等将插入操作分批进行。这些方法可以显著提高插入大量 DOM 元素时的性能，提供更流畅的用户体验。

## 二、内存不足，一次只允许你装载和操作 1 亿条数据，如何对 100 亿条数据进行排序

对于内存不足的情况，一次只允许装载和操作 1 亿条数据，而需要对 100 亿条数据进行排序，可以采用**外部排序**的方式。外部排序是一种在数据量大于内存容量的情况下使用的排序算法。以下是一个常见的策略，**多路归并排序**，用来完成这个任务。

### 步骤 1：分块排序

1. **分割数据**：将 100 亿条数据分成多个大小为 1 亿条数据的块。假设我们有 100 个块，每个块包含 1 亿条数据。

2. **单独排序**：依次读取每个块到内存中，对每个块单独进行排序。可以使用任何适合内存内排序的算法，比如快速排序（Quick Sort）、归并排序（Merge Sort）等。

3. **写回磁盘**：将排序后的每个块写回到磁盘中，这些是临时的中间文件。

### 步骤 2：多路归并

1. **初始化归并**：从磁盘上读取前 k 个块（通常 k 是你能一次性装入内存的块数），将每个块的第一个元素加载到内存的优先队列（小顶堆）中。这样可以通过堆来找到这些块中的最小值。

2. **逐步归并**：将最小的元素从堆中取出，并写入到输出文件中。然后，将该元素所在的块的下一个元素加载到堆中，保持堆的大小不变。

3. **写回结果**：重复这个过程，直到所有块都被处理完毕，并且所有数据都被写入最终的输出文件中。

### 步骤 3：输出最终排序结果

多路归并的结果就是 100 亿条数据的排序结果，它可以直接输出到一个文件中，或者写入到新的数据存储系统中。

### 总结

这种方式利用了磁盘来存储中间结果，通过将数据分块并在内存中逐步进行排序和归并，可以在内存限制的情况下高效地完成大数据量的排序。外部排序尤其适合这种需要处理大规模数据的场景。

## 三、在浏览器端，用 JS 存储 2 万个小球的信息，包含小球的大小，位置，颜色等，如何做到对这 2 万条小球信息进行最优检索和存储

**方案一**

在浏览器端存储和检索 2 万个小球的信息，包括大小、位置、颜色等，面临性能优化的挑战。要做到最优检索和存储，需要从数据结构设计、存储方式、检索算法等方面进行优化。以下是一个可能的优化方案：

### 1. 选择合适的数据结构

#### 1.1 使用 `TypedArray` 存储小球信息

为了在浏览器端高效地存储和处理大量的小球信息，`TypedArray` 是一种非常适合的结构。`TypedArray` 能够以较少的内存开销存储二进制数据，且能在计算上提升性能。

```javascript
const ballCount = 20000;
const balls = {
	size: new Float32Array(ballCount),
	x: new Float32Array(ballCount),
	y: new Float32Array(ballCount),
	color: new Uint8Array(ballCount), // 假设颜色可以用 8 位表示，比如索引或灰度值
};
```

每个属性的数组长度都为 20000，分别存储小球的大小、位置和颜色信息。这种结构在内存布局上连续且紧凑，有利于 CPU 缓存优化。

#### 1.2 使用 `Object` 进行高层次封装

为方便操作，可以用对象进行封装，减少低层次细节的直接操作。

```javascript
const balls = [];
for (let i = 0; i < ballCount; i++) {
	balls.push({
		size: Math.random() * 50,
		x: Math.random() * 500,
		y: Math.random() * 500,
		color: Math.floor(Math.random() * 256),
	});
}
```

这里的封装层可以包含高层次的方法进行属性访问、修改等操作。

### 2. 数据存储优化

#### 2.1 使用 Web Storage 或 IndexedDB

对于持久化存储，可以考虑使用 Web Storage（`localStorage` 或 `sessionStorage`）或者 `IndexedDB`。

- **Web Storage**：适合存储少量数据，通常限制在 5MB 左右。
- **IndexedDB**：适合存储大数据集，支持复杂的查询和事务处理。

使用 IndexedDB 示例：

```javascript
const request = indexedDB.open('BallDB', 1);

request.onupgradeneeded = event => {
	const db = event.target.result;
	const objectStore = db.createObjectStore('balls', { keyPath: 'id' });
};

request.onsuccess = event => {
	const db = event.target.result;
	const transaction = db.transaction(['balls'], 'readwrite');
	const objectStore = transaction.objectStore('balls');

	for (let i = 0; i < ballCount; i++) {
		objectStore.add({
			id: i,
			size: Math.random() * 50,
			x: Math.random() * 500,
			y: Math.random() * 500,
			color: Math.floor(Math.random() * 256),
		});
	}
};
```

### 3. 最优检索

#### 3.1 使用空间分割技术（如四叉树）

对于涉及位置的检索，使用空间分割技术能显著提升查询效率。四叉树是一种常用的数据结构，它将 2D 空间划分为四个象限，以递归方式存储位置数据，使得在特定区域内的查询更快。
以下是完善的四叉树代码，用于在浏览器端管理和检索 2 万个小球的信息。代码包括插入小球、划分子区域、区域查询等功能，并添加了一些注释和错误处理。

```javascript
class QuadTree {
	constructor(boundary, capacity) {
		this.boundary = boundary; // { x, y, width, height }
		this.capacity = capacity; // 每个节点的最大容量
		this.balls = []; // 存储当前节点的小球
		this.divided = false; // 是否已划分子区域
	}

	// 插入小球到四叉树中
	insert(ball) {
		// 如果小球不在当前节点的边界内，返回 false
		if (!this.contains(this.boundary, ball)) {
			return false;
		}

		// 如果当前节点未满，直接存储小球
		if (this.balls.length < this.capacity) {
			this.balls.push(ball);
			return true;
		} else {
			// 如果已满且未划分子区域，划分子区域
			if (!this.divided) {
				this.subdivide();
			}

			// 递归插入小球到合适的子区域
			return (
				this.northeast.insert(ball) ||
				this.northwest.insert(ball) ||
				this.southeast.insert(ball) ||
				this.southwest.insert(ball)
			);
		}
	}

	// 划分子区域
	subdivide() {
		const { x, y, width, height } = this.boundary;

		const ne = { x: x + width / 2, y: y, width: width / 2, height: height / 2 };
		this.northeast = new QuadTree(ne, this.capacity);

		const nw = { x, y, width: width / 2, height: height / 2 };
		this.northwest = new QuadTree(nw, this.capacity);

		const se = { x: x + width / 2, y: y + height / 2, width: width / 2, height: height / 2 };
		this.southeast = new QuadTree(se, this.capacity);

		const sw = { x, y: y + height / 2, width: width / 2, height: height / 2 };
		this.southwest = new QuadTree(sw, this.capacity);

		this.divided = true;
	}

	// 判断小球是否在当前区域内
	contains(boundary, ball) {
		return (
			ball.x >= boundary.x &&
			ball.x < boundary.x + boundary.width &&
			ball.y >= boundary.y &&
			ball.y < boundary.y + boundary.height
		);
	}

	// 判断区域是否相交
	intersects(range) {
		return !(
			range.x > this.boundary.x + this.boundary.width ||
			range.x + range.width < this.boundary.x ||
			range.y > this.boundary.y + this.boundary.height ||
			range.y + range.height < this.boundary.y
		);
	}

	// 查询指定区域内的所有小球
	queryRange(range, found = []) {
		// 如果指定区域与当前节点无交集，返回空数组
		if (!this.intersects(range)) {
			return found;
		}

		// 检查当前节点的小球是否在指定区域内
		for (const ball of this.balls) {
			if (this.contains(range, ball)) {
				found.push(ball);
			}
		}

		// 如果已划分子区域，递归查询子区域
		if (this.divided) {
			this.northeast.queryRange(range, found);
			this.northwest.queryRange(range, found);
			this.southeast.queryRange(range, found);
			this.southwest.queryRange(range, found);
		}

		return found;
	}

	// 绘制四叉树（可选，用于可视化调试）
	show(ctx) {
		ctx.strokeRect(this.boundary.x, this.boundary.y, this.boundary.width, this.boundary.height);

		if (this.divided) {
			this.northeast.show(ctx);
			this.northwest.show(ctx);
			this.southeast.show(ctx);
			this.southwest.show(ctx);
		}

		for (const ball of this.balls) {
			ctx.beginPath();
			ctx.arc(ball.x, ball.y, 2, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

// 使用 QuadTree 存储和检索小球信息
const boundary = { x: 0, y: 0, width: 500, height: 500 };
const qt = new QuadTree(boundary, 4); // 容量设置为 4，可根据需要调整

// 插入 20000 个小球
for (let i = 0; i < 20000; i++) {
	const ball = {
		x: Math.random() * boundary.width,
		y: Math.random() * boundary.height,
		size: Math.random() * 20,
		color: Math.floor(Math.random() * 256),
	};
	qt.insert(ball);
}

// 查询指定区域内的小球
const range = { x: 100, y: 100, width: 200, height: 200 };
const foundBalls = qt.queryRange(range);

// 输出查询到的小球信息
console.log(`Found ${foundBalls.length} balls in the specified range.`);
```

### 关键功能说明：

1. **插入小球**：每次插入小球时，四叉树会根据小球的坐标递归地选择适当的子区域进行存储。如果当前节点尚未达到容量上限（如 4 个小球），则直接存储；否则，划分子区域，并将现有小球以及新小球递归插入到适当的子区域。

2. **划分子区域**：一旦达到容量上限，节点会划分为四个子区域（东北、西北、东南、西南）。新插入的小球会继续递归存储到合适的子区域中。

3. **区域查询**：通过 `queryRange` 方法，可以高效地检索指定区域内的小球。该方法首先检查当前节点是否与查询区域相交，如果相交，则进一步检查该节点的小球是否在查询区域内，并递归地检查子区域。

4. **可视化调试**：`show` 方法可用于绘制四叉树结构及其存储的小球，帮助开发人员直观地理解四叉树的划分及小球分布情况。

### 使用建议：

- **性能调优**：可以通过调整四叉树的容量（`capacity`）以及对空间的划分策略进行性能调优。
- **实际应用**：在需要处理大量空间数据的应用中，如游戏开发、地理信息系统、碰撞检测等场景，四叉树结构可以显著提升数据检索和存储的效率。

### 4. 性能测试与调优

在开发和部署过程中，务必对存储和检索性能进行测试和分析。使用 Chrome DevTools 的 Profiler 和 Memory 工具分析内存使用和检索速度，进一步优化数据结构、检索算法或内存分配。

### 总结

通过使用 `TypedArray` 进行高效存储，借助 IndexedDB 持久化大数据，结合四叉树优化检索，这套方案能够有效管理和快速检索 2 万个小球的信息。此方法特别适合需要处理大规模数据的前端应用场景。

**方案二**

### 背景

- **`ArrayBuffer` 和 `TypedArray`**：提供了在 JavaScript 中处理原始二进制数据的能力，非常适合存储和操作大量的数值数据。
- **`IndexedDB`**：用于浏览器端的持久化存储，支持事务和索引，可以存储结构化数据。

### 方案思路

1. **数据编码**：将小球的各项信息（大小、位置、颜色）编码为二进制数据，存储在 `ArrayBuffer` 中。
2. **批量插入**：将 `TypedArray` 转换为普通数组后批量插入 `IndexedDB`，减少数据库操作开销。
3. **检索与解码**：从 `IndexedDB` 检索数据后解码为可读信息，返回给前端应用。

### 实现代码

```javascript
class BallStorage {
	constructor() {
		this.dbName = 'BallsDB';
		this.storeName = 'balls';
		this.db = null;
		this.initDB();
	}

	// 初始化数据库
	initDB() {
		const dbRequest = indexedDB.open(this.dbName, 1);

		dbRequest.onupgradeneeded = event => {
			const db = event.target.result;
			db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
		};

		dbRequest.onsuccess = event => {
			this.db = event.target.result;
			console.log('IndexedDB initialized.');
		};

		dbRequest.onerror = event => {
			console.error('IndexedDB error:', event);
		};
	}

	// 将小球信息编码成 ArrayBuffer
	encodeBallData(size, posX, posY, color) {
		const buffer = new ArrayBuffer(16);
		const view = new DataView(buffer);

		view.setFloat32(0, size, true); // 4 bytes
		view.setFloat32(4, posX, true); // 4 bytes
		view.setFloat32(8, posY, true); // 4 bytes
		view.setUint8(12, color[0]); // 1 byte
		view.setUint8(13, color[1]); // 1 byte
		view.setUint8(14, color[2]); // 1 byte

		return buffer;
	}

	// 将 ArrayBuffer 解码为小球信息
	decodeBallData(buffer) {
		const view = new DataView(buffer);

		const size = view.getFloat32(0, true);
		const posX = view.getFloat32(4, true);
		const posY = view.getFloat32(8, true);
		const color = [view.getUint8(12), view.getUint8(13), view.getUint8(14)];

		return { size, posX, posY, color };
	}

	// 插入单个小球数据
	insertBall(size, posX, posY, color) {
		const buffer = this.encodeBallData(size, posX, posY, color);

		const transaction = this.db.transaction(this.storeName, 'readwrite');
		const store = transaction.objectStore(this.storeName);

		const request = store.put({ data: buffer });

		request.onsuccess = () => {
			console.log('Ball data inserted.');
		};

		request.onerror = event => {
			console.error('Insert ball error:', event);
		};
	}

	// 批量插入小球数据
	insertBalls(ballsData) {
		const transaction = this.db.transaction(this.storeName, 'readwrite');
		const store = transaction.objectStore(this.storeName);

		ballsData.forEach(ball => {
			const buffer = this.encodeBallData(ball.size, ball.posX, ball.posY, ball.color);
			store.put({ data: buffer });
		});

		transaction.oncomplete = () => {
			console.log('All ball data inserted.');
		};

		transaction.onerror = event => {
			console.error('Insert balls error:', event);
		};
	}

	// 根据大小检索小球数据
	getBallsBySize(size, callback) {
		const transaction = this.db.transaction(this.storeName, 'readonly');
		const store = transaction.objectStore(this.storeName);

		const balls = [];
		store.openCursor().onsuccess = event => {
			const cursor = event.target.result;
			if (cursor) {
				const ball = this.decodeBallData(cursor.value.data);
				if (ball.size === size) {
					balls.push(ball);
				}
				cursor.continue();
			} else {
				callback(balls);
			}
		};
	}

	// 关闭数据库
	closeDB() {
		if (this.db) {
			this.db.close();
			console.log('IndexedDB closed.');
		}
	}
}

// 使用示例
const ballStorage = new BallStorage();

// Example ball data
const ballData = {
	size: 20,
	posX: 100.5,
	posY: 150.25,
	color: [255, 0, 0],
};

// Insert a single ball
ballStorage.insertBall(ballData.size, ballData.posX, ballData.posY, ballData.color);

// Insert multiple balls
const ballsData = [];
for (let i = 0; i < 20000; i++) {
	ballsData.push({
		size: Math.floor(Math.random() * 100),
		posX: Math.random() * 500,
		posY: Math.random() * 500,
		color: [
			Math.floor(Math.random() * 256),
			Math.floor(Math.random() * 256),
			Math.floor(Math.random() * 256),
		],
	});
}
ballStorage.insertBalls(ballsData);

// Retrieve balls by size
ballStorage.getBallsBySize(20, balls => {
	console.log('Balls with size 20:', balls);
});

// Close the database
ballStorage.closeDB();
```

### 代码详解

1. **初始化数据库**：

   - `initDB()` 方法初始化 `IndexedDB`，创建存储 `balls` 数据的对象仓库。

2. **数据编码与解码**：

   - `encodeBallData()` 将小球的信息编码为 `ArrayBuffer`，以节省存储空间。使用 `DataView` 操作二进制数据。
   - `decodeBallData()` 反过来将 `ArrayBuffer` 解码为可读的小球信息。

3. **数据插入**：

   - `insertBall()` 用于插入单个小球数据。
   - `insertBalls()` 支持批量插入，减少事务开销，提升性能。

4. **数据检索**：

   - `getBallsBySize()` 通过遍历 `IndexedDB` 进行筛选，检索符合大小条件的小球数据。

5. **数据库关闭**：
   - `closeDB()` 方法确保在操作结束后关闭数据库，释放资源。

### 性能与存储优化

通过使用 `ArrayBuffer` 和 `TypedArray`，该方案极大减少了存储小球信息所需的空间。同时，`IndexedDB` 提供了持久化存储和高效检索的功能，适用于浏览器端的大数据存储需求。在高并发场景下，可以通过 Web Workers 分担计算压力，避免主线程阻塞。

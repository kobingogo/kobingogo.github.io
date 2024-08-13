console.time('forLoop');
let array = new Array(10000000).fill(0);

for (let i = 0; i < array.length; i++) {
	array[i] = i;
}
console.timeEnd('forLoop');

console.time('forOfLoop');
array = new Array(10000000).fill(0);

for (const item of array) {
	// Do nothing
}
console.timeEnd('forOfLoop');

console.time('forInLoop');
const object = {};
for (let i = 0; i < 10000000; i++) {
	object[i] = i;
}

for (const key in object) {
	// Do nothing
}
console.timeEnd('forInLoop');

console.time('map');
array = new Array(10000000).fill(0);

array.map(item => {
	return item;
});
console.timeEnd('map');

console.time('filter');
array = new Array(10000000).fill(0);

array.filter(item => {
	return item % 2 === 0;
});
console.timeEnd('filter');

console.time('forEach');
array = new Array(10000000).fill(0);

array.forEach(item => {
	// Do nothing
});
console.timeEnd('forEach');

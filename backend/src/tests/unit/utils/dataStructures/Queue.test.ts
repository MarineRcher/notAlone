import Queue from "../../../../utils/dataStructures/Queue";

describe("Queue", () => {
	let queue: Queue<number>;

	beforeEach(() => {
		queue = new Queue<number>();
	});

	describe("enqueue", () => {
		it("should add an element to the queue", () => {
			queue.enqueue(1);
			expect(queue.size()).toBe(1);
			expect(queue.peek()).toBe(1);
		});

		it("should add multiple elements in correct order", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			queue.enqueue(3);
			expect(queue.size()).toBe(3);
			expect(queue.peek()).toBe(1);
		});
	});

	describe("dequeue", () => {
		it("should remove and return the first element", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			const item = queue.dequeue();
			expect(item).toBe(1);
			expect(queue.size()).toBe(1);
		});

		it("should return undefined when queue is empty", () => {
			const item = queue.dequeue();
			expect(item).toBeUndefined();
		});

		it("should maintain FIFO order when dequeuing multiple elements", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			queue.enqueue(3);

			expect(queue.dequeue()).toBe(1);
			expect(queue.dequeue()).toBe(2);
			expect(queue.dequeue()).toBe(3);
			expect(queue.isEmpty()).toBe(true);
		});
	});

	describe("peek", () => {
		it("should return the first element without removing it", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			expect(queue.peek()).toBe(1);
			expect(queue.size()).toBe(2);
		});

		it("should return undefined when queue is empty", () => {
			expect(queue.peek()).toBeUndefined();
		});
	});

	describe("isEmpty", () => {
		it("should return true for empty queue", () => {
			expect(queue.isEmpty()).toBe(true);
		});

		it("should return false when queue has elements", () => {
			queue.enqueue(1);
			expect(queue.isEmpty()).toBe(false);
		});

		it("should return true after dequeuing all elements", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			queue.dequeue();
			queue.dequeue();
			expect(queue.isEmpty()).toBe(true);
		});
	});

	describe("size", () => {
		it("should return 0 for empty queue", () => {
			expect(queue.size()).toBe(0);
		});

		it("should return correct size after enqueuing", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			expect(queue.size()).toBe(2);
		});

		it("should return correct size after dequeuing", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			queue.dequeue();
			expect(queue.size()).toBe(1);
		});
	});

	describe("clear", () => {
		it("should remove all elements from the queue", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			queue.clear();
			expect(queue.isEmpty()).toBe(true);
			expect(queue.size()).toBe(0);
		});

		it("should work on empty queue", () => {
			queue.clear();
			expect(queue.isEmpty()).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("should handle enqueue after dequeue", () => {
			queue.enqueue(1);
			queue.dequeue();
			queue.enqueue(2);
			expect(queue.size()).toBe(1);
			expect(queue.peek()).toBe(2);
		});

		it("should handle multiple operations in sequence", () => {
			queue.enqueue(1);
			queue.enqueue(2);
			queue.dequeue();
			queue.enqueue(3);
			queue.dequeue();
			expect(queue.peek()).toBe(3);
			expect(queue.size()).toBe(1);
		});
	});
});

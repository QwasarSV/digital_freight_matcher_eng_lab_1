class Queue<T> {
    private elements: T[] = [];
  
    enqueue(element: T): void {
        this.elements.push(element);
    }
  
    dequeue(): T | undefined {
        return this.elements.shift();
    }
  
    peek(): T | undefined {
        return this.elements[0];
    }
  
    isEmpty(): boolean {
        return this.elements.length === 0;
    }
  
    size(): number {
        return this.elements.length;
    }
}


/*   usage : */ 

// const queue = new Queue<number>();
// queue.enqueue(1);
// queue.enqueue(2);
// queue.enqueue(3);

// console.log(queue.dequeue());
// console.log(queue.peek()); 
// console.log(queue.isEmpty());
// console.log(queue.size());

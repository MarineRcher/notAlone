export default class Queue<T> {
    private items: T[] = [];

    // Ajouter un élément à la fin de la queue
    enqueue(item: T): void {
        this.items.push(item);
    }

    // Retirer le premier élément de la queue
    dequeue(): T | undefined {
        return this.items.shift();
    }

    // Voir le premier élément sans le retirer
    peek(): T | undefined {
        return this.items[0];
    }

    // Vérifier si la queue est vide
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    // Obtenir la taille de la queue
    size(): number {
        return this.items.length;
    }

    // Vider la queue
    clear(): void {
        this.items = [];
    }
}
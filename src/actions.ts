

interface TItem{
    id: number;
    name: string;
    price: number;
    category: string;
    thumbnail: string;
}


export class DbServive{
    private db: IDBDatabase | null = null;
    private readonly dbName: string = 'DesertDB';
    private readonly storeName: string = 'DesertStore';

    constructor() {
        this.initDatabase();
    }

    public initDatabase() {
        return new Promise((resolve,reject) =>{
            const request = indexedDB.open(this.dbName, 1);

            // errors
            request.onerror = (event) => {
                console.error('Database error:', event);
                reject(event);
            };

            // success
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            // create object store
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if(!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('id', 'id', { unique: true });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('price', 'price', { unique: false });
                    objectStore.createIndex('category', 'category', { unique: false });
                    objectStore.createIndex('thumbnail', 'thumbnail', { unique: false });
                }
            }
        })
    }



// crud operations

// add item 
async addItem(item: TItem): Promise<void> {
    return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.add(item);

        request.onsuccess = () => {
            console.log('Item added successfully');
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error adding item:', event);
            reject(event);
        };
    });
}

// get all items
async getAllItems(): Promise<TItem[]> {
    return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(this.storeName, 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const items = (event.target as IDBRequest).result;
            resolve(items);
        };

        request.onerror = (event) => {
            console.error('Error getting items:', event);
            reject(event);
        };
    })};

    // update item
async updateItem(item: TItem): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.put(item);

            request.onsuccess = () => {
                console.log('Item updated successfully');
                resolve();
            };

            request.onerror = (event) => {
                console.error('Error updating item:', event);
                reject(event);
            };
        });
    }

// delete item
async deleteItem(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            console.log('Item deleted successfully');
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error deleting item:', event);
            reject(event);
        };
    })};





}
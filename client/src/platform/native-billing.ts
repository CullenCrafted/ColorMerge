/**
 * Native billing integration boundary. No provider is activated in this build.
 * A StoreKit/Google Play provider must fetch actual localized products, finish
 * purchases only after server receipt verification, and restore transactions.
 * Device callbacks and client receipts alone must never credit the wallet.
 */
export interface NativeProduct {id:string;hearts:number;localizedPrice:string}
export interface NativeBilling {
 available():Promise<boolean>;
 products():Promise<NativeProduct[]>;
 purchase(productId:string):Promise<{transactionId:string;state:'pending'|'verified'}>;
 restore():Promise<void>;
}
export const unavailableNativeBilling:NativeBilling={
 async available(){return false;},
 async products(){return [];},
 async purchase(){throw new Error('Native store billing is not configured. Free play is available.');},
 async restore(){throw new Error('Native store billing is not configured.');},
};

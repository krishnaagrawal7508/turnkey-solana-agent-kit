
// import { 
//     Transaction, 
//     VersionedTransaction, 
//     PublicKey, 
//     SendOptions, 
//     TransactionSignature, 
//     Connection, 
// } from '@solana/web3.js';

// type TransactionOrVersionedTransaction = Transaction | VersionedTransaction;

// export class TurnkeyWallet {
//     readonly publicKey: PublicKey;
//     private authIframeClient: any;
//     private suborgId: string;
//     private selectedAccount: string;
//     private connection: Connection;

//     constructor(
//         publicKey: PublicKey,
//         authIframeClient: any,
//         suborgId: string,
//         selectedAccount: string,
//         connection: Connection
//     ) {
//         this.publicKey = publicKey;
//         this.authIframeClient = authIframeClient;
//         this.suborgId = suborgId;
//         this.selectedAccount = selectedAccount;
//         this.connection = connection;
//     }

//     async signMessage(message: Uint8Array): Promise<Uint8Array> {
//         try {
//             const hexMessage = Buffer.from(message).toString('hex');

//             const signatureResponse = await this.authIframeClient?.signRawPayload({
//                 organizationId: this.suborgId,
//                 signWith: this.selectedAccount,
//                 payload: hexMessage,
//                 encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
//                 hashFunction: "HASH_FUNCTION_NOT_APPLICABLE",
//             });

//             if (!signatureResponse) {
//                 throw new Error('Failed to get signature response from Turnkey');
//             }

//             return new Uint8Array(
//                 Buffer.from(signatureResponse.r + signatureResponse.s, 'hex')
//             );
//         } catch (error) {
//             console.error('Error signing message:', error);
//             throw error;
//         }
//     }

//     async signTransaction<T extends Transaction | VersionedTransaction | TransactionOrVersionedTransaction>(
//         transaction: T
//     ): Promise<T> {
//         try {
//             // Handle both regular and versioned transactions
//             let serializedMessage: Uint8Array;

//             if (transaction instanceof VersionedTransaction) {
//                 serializedMessage = transaction.message.serialize();
//             } else if (transaction instanceof Transaction) {
//                 serializedMessage = transaction.serializeMessage();
//             } else {
//                 throw new Error('Unsupported transaction type');
//             }

//             const hexMessage = Buffer.from(serializedMessage).toString('hex');

//             const signatureResponse = await this.authIframeClient?.signRawPayload({
//                 organizationId: this.suborgId,
//                 signWith: this.selectedAccount,
//                 payload: hexMessage,
//                 encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
//                 hashFunction: "HASH_FUNCTION_NOT_APPLICABLE",
//             });

//             if (!signatureResponse) {
//                 throw new Error('Failed to get signature response from Turnkey');
//             }

//             // Create signature from r and s components
//             const signature = new Uint8Array(
//                 Buffer.from(signatureResponse.r + signatureResponse.s, 'hex')
//             );

//             // Add signature to the transaction
//             if (transaction instanceof VersionedTransaction) {
//                 transaction.addSignature(this.publicKey, signature);
//             } else if (transaction instanceof Transaction) {
//                 transaction.addSignature(this.publicKey, Buffer.from(signature));
//             }

//             return transaction;
//         } catch (error) {
//             console.error('Error signing transaction:', error);
//             throw error;
//         }
//     }

//     async signAllTransactions<T extends Transaction | VersionedTransaction | TransactionOrVersionedTransaction>(
//         transactions: T[]
//     ): Promise<T[]> {
//         // Sign each transaction individually
//         return Promise.all(transactions.map(transaction => this.signTransaction(transaction)));
//     }

//     async sendTransaction<T extends Transaction | VersionedTransaction | TransactionOrVersionedTransaction>(
//         transaction: T
//     ): Promise<string> {
//         try {
//             // First sign the transaction
//             const signedTransaction = await this.signTransaction(transaction);

//             // Prepare and send the transaction
//             let rawTransaction: Buffer;

//             if (signedTransaction instanceof VersionedTransaction) {
//                 rawTransaction = signedTransaction.serialize();
//             } else if (signedTransaction instanceof Transaction) {
//                 rawTransaction = signedTransaction.serialize();
//             } else {
//                 throw new Error('Unsupported transaction type');
//             }

//             // Send the transaction
//             const signature = await this.connection.sendRawTransaction(
//                 rawTransaction,
//                 { skipPreflight: false, preflightCommitment: 'confirmed' }
//             );

//             return signature;
//         } catch (error) {
//             console.error('Error sending transaction:', error);
//             throw error;
//         }
//     }

//     async signAndSendTransaction<T extends Transaction | VersionedTransaction | TransactionOrVersionedTransaction>(
//         transaction: T,
//         options?: SendOptions
//     ): Promise<{ signature: TransactionSignature }> {
//         try {
//             // Sign the transaction
//             const signedTransaction = await this.signTransaction(transaction);

//             // Prepare the transaction for sending
//             let rawTransaction: Buffer;

//             if (signedTransaction instanceof VersionedTransaction) {
//                 rawTransaction = signedTransaction.serialize();
//             } else if (signedTransaction instanceof Transaction) {
//                 rawTransaction = signedTransaction.serialize();
//             } else {
//                 throw new Error('Unsupported transaction type');
//             }

//             // Send with the provided options or defaults
//             const sendOptions = options || {
//                 skipPreflight: false,
//                 preflightCommitment: 'confirmed'
//             };

//             // Send the transaction
//             const signature = await this.connection.sendRawTransaction(rawTransaction, sendOptions);

//             return { signature };
//         } catch (error) {
//             console.error('Error in signAndSendTransaction:', error);
//             throw error;
//         }
//     }
// }

// // Helper function to create a Turnkey wallet instance
// // export function createTurnkeyWallet(
// //     publicKeyString: string,
// //     authIframeClient: any,
// //     suborgId: string,
// //     selectedAccount: string,
// //     connection: Connection
// // ): TurnkeyWallet {
// //     const publicKey = new PublicKey(publicKeyString);
// //     return new TurnkeyWallet(
// //         publicKey,
// //         authIframeClient,
// //         suborgId,
// //         selectedAccount,
// //         connection
// //     );
// // }

// // Example usage:
// /*
// import { Connection } from '@solana/web3.js';
 
// // Initialize connection to Solana network
// const connection = new Connection('https://api.mainnet-beta.solana.com');
 
// // Create the wallet
// const turnkeyWallet = createTurnkeyWallet(
//   selectedAccount,  // Your Solana address from Turnkey
//   authIframeClient, // Your initialized Turnkey client
//   suborgId,         // Your Turnkey organization ID
//   selectedAccount,  // The account to sign with
//   connection        // Solana connection
// );
 
// // Now you can use this wallet with Solana Agent Kit
// */
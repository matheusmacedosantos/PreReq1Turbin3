import {
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const from = Keypair.fromSecretKey(new Uint8Array(wallet));
const to = new PublicKey("8T9GcCqpjy3NJX1nMkhVPhzJW8zgFJhNxASn4whhRTX2");
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    const balance = await connection.getBalance(from.publicKey);
    console.log(`Balance retrieved: ${balance} lamports`);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance,
      })
    );

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;
    console.log(`Recent blockhash: ${transaction.recentBlockhash}`);

    transaction.feePayer = from.publicKey;
    console.log(`Fee payer set to: ${from.publicKey.toBase58()}`);

    const fee =
      (
        await connection.getFeeForMessage(
          transaction.compileMessage(),
          "confirmed"
        )
      ).value || 0;
    console.log(`Transaction fee calculated: ${fee} lamports`);

    transaction.instructions.pop();
    console.log("Original transfer instruction removed.");

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance - fee,
      })
    );
    console.log(`New transfer instruction added with amount: ${balance - fee} lamports`);

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      from,
    ]);
    console.log(`Transaction signed and sent. Signature: ${signature}`);
    console.log(`Success! Check your transaction here:
        https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error(`Error: ${e}`);
  }
})();


import amqp from "amqplib";
import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind } from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { SimpleQueueType } from "../enums.js";
import type { Channel } from "amqplib";

async function main() {
  const connection = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(connection);

  console.log("Starting Peril client...");

  const userName = await clientWelcome()

  const [channel, queue] = await declareAndBind(conn, ExchangePerilDirect, `pause.${userName}`, PauseKey, SimpleQueueType.Transient)
  
  
  
  
  process.on("SIGINT", async () => {
    console.log("Shutting down");

    await conn.close();

    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

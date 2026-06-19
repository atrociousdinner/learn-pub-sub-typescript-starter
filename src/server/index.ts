import amqp from "amqplib"
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState, type PlayingState } from "../internal/gamelogic/gamestate.js";


async function main() {

  const connection = 'amqp://guest:guest@localhost:5672/'
  const conn = await amqp.connect(connection)


  console.log("Starting Peril server...");


  process.on("SIGINT", async () => {
    console.log("Shutting down")

    await conn.close();

    process.exit(0);

  })

  const channel = await conn.createConfirmChannel()
  const state: PlayingState = {
    isPaused: true
  }
  publishJSON(channel, ExchangePerilDirect, PauseKey, state)

}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

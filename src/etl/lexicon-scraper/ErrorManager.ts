import fs from "fs/promises";
import path from "path";

export class ErrorManager {
  static async handleError(error: Error) {
    const { name, message, stack } = error;
    console.error(JSON.stringify({ name, message, stack }, null, 2))
    try {
      await fs.appendFile(
        path.resolve(__dirname, "error.log"),
        `${new Date().toISOString()} - ERROR: ${JSON.stringify({
          name,
          message,
          stack,
        })}\n`
      );
    } catch (error) {
      console.error(error);
    }
  }
}

import { Handler } from "aws-lambda";

const handler: Handler = async (event, context) => {
  // console.log("event", event);
  // console.log("event.headers", event.headers);
  console.log("event.headers.Host", event.headers.Host);
  return {
    statusCode: 200,
    body: "HELLO WORLD.",
  };
};

export default handler;

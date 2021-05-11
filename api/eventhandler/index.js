const { HTTP } = require('cloudevents');

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      headers: {
        "WebHook-Allowed-Origin": "*"
      },
      body: "{}"
    };
    return
  }

  const event = await convertHttpToEvent(req);
  const cloudevent = await HTTP.toEvent(event);
  context.res = {
    headers: {
      "ce-specversion": cloudevent["specversion"],
      "ce-type": cloudevent["type"],
      "ce-source": cloudevent["source"],
      "ce-id": cloudevent["id"],
      "ce-time": cloudevent["time"],
    }
  };
  if (cloudevent.eventname === "message") {
    context.res.headers["ce-signature"] = cloudevent["signature"];
    context.res.headers["ce-userId"] = cloudevent["userid"];
    context.res.headers["ce-connectionId"] = cloudevent["connectionid"];
    context.res.headers["ce-hub"] = cloudevent["hub"];
    context.res.headers["ce-eventName"] = cloudevent["eventname"];

    context.bindings.webPubSubOperation = {
      "operationKind": "sendToAll",
      "message": JSON.stringify({
        "from": cloudevent.userid,
        "message": `${cloudevent.data}`,
      }),
      "dataType": "text"

    };
    // return;
  } else if (cloudevent.eventname === "connected") {
    context.bindings.webPubSubOperation = {
      "operationKind": "sendToAll",
      "message": JSON.stringify({
        "type": "system",
        "message": `${cloudevent.userid} joined`,
      }),
      "dataType": "text",
    };
  }
}

async function convertHttpToEvent(request) {
  const normalized = {
    headers: {},
    body: ""
  };
  if (request.headers) {
    for (const key in request.headers) {
      if (Object.prototype.hasOwnProperty.call(request.headers, key)) {
        const element = request.headers[key];
        if (element === undefined) {
          continue;
        }
        if (typeof element === "string") {
          normalized.headers[key] = element;
        } else {
          normalized.headers[key] = element.join(",");
        }
      }
    }
  }
  normalized.body = request.body;
  return normalized;
}

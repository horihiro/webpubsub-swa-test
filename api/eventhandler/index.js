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
  } else if (cloudevent.eventname === "connected" || cloudevent.eventname === "disconnected") {
    const userList = context.bindings.userListInput;
    let targetUser = userList.sort((a, b) => {
      return a.RowKey > b.RowKey ? 1 : -1
    }).find((user) => {
      user.userid === cloudevent.userid
    });
    if (!targetUser) {
      targetUser = {
        PartitionKey: "Test",
        userid: cloudevent.userid
      };
      userList.push(targetUser);
    }
    targetUser.status = cloudevent.eventname === "connected" ? "online" : "offline";
    targetUser.RowKey = Date.now();
    const userIdList = Array.from(new Set(userList.map(user => user.userid)));
    const statusList = [];
    userIdList.forEach((userid) => {
      statusList.push({
        userid,
        status: userList.filter((user) => user.userid === userid).reduce((prev, curr) => {
          return prev.RawKey > curr.RawKey ? prev : curr;
        }, {RawKey: 0}).status
      })
    });
    context.bindings.webPubSubOperation = {
      "operationKind": "sendToAll",
      "message": JSON.stringify({
        "type": "system",
        "message": JSON.stringify({
          statusList
        }),
      }),
      "dataType": "text",
    };
    context.bindings.userListOutput = [targetUser];
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

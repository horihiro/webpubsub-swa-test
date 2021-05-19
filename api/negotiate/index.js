module.exports = async function (context, connection) {
  const signalRConnectionInfo = context.bindings.signalRConnectionInfo;
  const webPubSubConnectionInfo = context.bindings.webPubSubConnectionInfo;
  context.res = {
    body: {
      webPubSubConnectionInfo,
      // signalRConnectionInfo
    }
  };
}
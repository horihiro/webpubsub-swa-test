module.exports = async function (context, req) {
  context.log(context.bindings.userInfoInput);
  if (!context.bindings.userInfoInput) context.bindings.userInfoOutput = {
    PartitionKey: "Test",
    RowKey: context.req.query.userid,
    Name: context.req.query.userid
  };
  context.res = {
    body: context.bindings.connection
  };
}
module.exports = async function (context, myTimer) {
  var timeStamp = new Date().toISOString();

  if (myTimer.IsPastDue)
  {
      context.log('Node is running late!');
  }
  context.log('Node timer trigger function ran!', timeStamp);   
};
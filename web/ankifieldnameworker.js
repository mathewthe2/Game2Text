onmessage = function(e) {
  const modelName = e.data;
  const fieldNames = await getFieldNamesForModel(modelName);
  postMessage([modelNAme, fieldNames]);
}
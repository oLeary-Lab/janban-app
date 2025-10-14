export const generateJanbanId = (prefix: string, count: number) => {
  if (count === 0) {
    return `${prefix}000001`;
  }

  const suffix = count.toString().padStart(6, "0");
  return `${prefix}${suffix}`;
};

export const checkDatabaseForJanbanId = async (
  model: any,
  fieldName: string,
  value: string
) => {
  const document = await model.findOne({ [fieldName]: value });
  return !!document;
};

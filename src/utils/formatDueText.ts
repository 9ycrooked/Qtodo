export const getTodayDateValue = () => {
  const today = new Date();

  return [
    today.getFullYear(),
    `${today.getMonth() + 1}`.padStart(2, "0"),
    `${today.getDate()}`.padStart(2, "0"),
  ].join("-");
};

export const formatDueText = (dueDate?: string, dueTime?: string) => {
  if (!dueDate && !dueTime) {
    return "";
  }

  const dateText = dueDate
    ? dueDate === getTodayDateValue()
      ? "今天"
      : `${Number(dueDate.slice(5, 7))}月${Number(dueDate.slice(8, 10))}日`
    : "今天";

  return dueTime ? `${dateText} ${dueTime} 截止` : `${dateText} 截止`;
};

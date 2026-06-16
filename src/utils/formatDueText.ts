import { currentDate } from "./currentDate";

export const formatDueText = (dueDate?: string, dueTime?: string) => {
  if (!dueDate && !dueTime) {
    return "";
  }

  const dateText = dueDate
    ? dueDate === currentDate()
      ? "今天"
      : `${Number(dueDate.slice(5, 7))}月${Number(dueDate.slice(8, 10))}日`
    : "今天";

  return dueTime ? `${dateText} ${dueTime} 截止` : `${dateText} 截止`;
};

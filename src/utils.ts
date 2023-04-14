import { format, hoursToMilliseconds, millisecondsToHours } from "date-fns";
import config from "./config/config.json";

const claim_duration_in_ms = hoursToMilliseconds(
  config.claim_duration_in_hours
);

export const dateFormat = (date: Date) => {
  const _date = new Date(date);
  return format(_date, "yyyy/MM/dd");
};

export const dateFormatGeneral = (date: Date | null, stringFormat: boolean) => {
  if (!date) return null;
  const _date = dateFormat(date).split("/");
  const { day, month, year } = {
    day: _date[0],
    month: _date[1],
    year: _date[2],
  };
  if (stringFormat) {
    return `${year}-${month}-${day}`;
  }
  return { day, month, year };
};
// export const dateFormatGeneral = (date: Date | null, stringFormat: boolean) => {
//   if (!date) return null;
//   const _date = new Date(date);
//   const { day, month, year } = {
//     day: _date.getUTCDate(),
//     month: _date.getUTCMonth() + 1,
//     year: _date.getUTCFullYear(),
//   };
//   if (stringFormat) {
//     return `${year}-${month}-${day}`;
//   }
//   return { day, month, year };
// };

export const getTimeLeft = (date: Date | null): number | null => {
  if (!date) {
    return null;
  }
  const now = new Date().getTime();
  const givenDate = new Date(date).getTime();
  const expiryDate = givenDate + claim_duration_in_ms;
  if (expiryDate < now) {
    return null;
  }
  const timeLeft = millisecondsToHours(givenDate - now);
  return timeLeft;
};

export const getTimeLeftText = (date: Date | null) => {
  if (!date) {
    return "no timestamp found";
  }
  const hours = getTimeLeft(date);
  if (!hours) {
    return "expired";
  }
  return `${hours} hours left`;
};

const wordsFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
});

export const getCount = (item: number | string) => {
  const formattedItem = typeof item === "string" ? item.length : item;
  return wordsFormat.format(formattedItem);
};

export class Metadata {
  private metaData: string;
  public username: string;
  public fileTitle: string;
  public source: string;

  constructor(fileTitle: string, username: string, url: string, tags?: string[], speakers?: string[], categories?: string[]) {

    this.username = username;
    this.fileTitle = fileTitle;
    this.source = url;

    this.metaData = `---\n` +
                    `title: ${fileTitle}\n` +
                    `transcript_by: ${username} \n`;

    this.metaData += `media: ${url}\n`;

    if (tags) {
      this.metaData += this.formatList("tags", tags);
    }

    if (speakers) {
      this.metaData += this.formatList("speakers", speakers);
    }

    if (categories) {
      this.metaData += this.formatList("categories", categories);
    }
  }

  private formatList(keyword: string, values: string[]): string {
    values = values.map((value) => value.trim());
    const formattedList = `${keyword}: ${values.join(", ")}\n`;
    return formattedList;
  }

  public toString(): string {
    return this.metaData;
  }
}

export async function retryApiCall<T>(
  apiCallFunc: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiCallFunc();
      return response;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`API call failed after ${retries} attempts`);
}

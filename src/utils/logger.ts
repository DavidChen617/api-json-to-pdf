// Logger utility class
export class Logger {
  static info(message: string, ...args: any[]) {
    console.log(message, ...args);
  }
  
  static success(message: string, ...args: any[]) {
    console.log(message, ...args);
  }
  
  static warning(message: string, ...args: any[]) {
    console.log(message, ...args);
  }
  
  static error(message: string, ...args: any[]) {
    console.error(message, ...args);
  }
}
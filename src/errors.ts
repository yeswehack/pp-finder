


export class InvalidBackupError extends Error {
  constructor() {
    super("Invalid backup file");
  }
}


export class UnimplementedError extends Error {
  constructor() {
    super("Unimplemented");
  }
}

export class PlatformEnum {
  public static WINDOWS = 0;
  public static MACOS = 1;

  public static choices = {
    [this.WINDOWS]: 'WINDOWS',
    [this.MACOS]: 'MACOS',
  };
}

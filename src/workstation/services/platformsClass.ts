import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';

export class WINDOWS {
  public static CLINIVIEW(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ): void {
    imagingSoftware.originalName = 'clinivie';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param1;
  }

  public static CYGNUS(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'acteonImagingSuite';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  public static DBSWIN(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'dbswin';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param1;
  }

  public static DIGORA(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'digora';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  public static DIMAXIS(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'romexis';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.imageBasenameLength = Number(parameters?.FormatDossier);
  }

  public static DURRDENTAL(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'dbswin';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param1;
  }

  public static EASYDENT(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'vatech';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  public static GENDEX(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'vixwin';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.imageDirname = parameters?.CheminImg;
    imagingSoftware.imageBasenameLength = Number(parameters?.FormatDossier);
  }

  public static INSTRUMENTARIUM(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'cliniview';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param1;
  }

  public static MEDIADENT(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'mediadent';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.imageDirname = parameters?.CheminImg;
    imagingSoftware.imageBasenameLength = 6;
  }

  public static MYRAY(imagingSoftware: ImagingSoftwareEntity, parameters: any) {
    imagingSoftware.originalName = 'myray';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param2;
  }

  public static NNT(imagingSoftware: ImagingSoftwareEntity, parameters: any) {
    imagingSoftware.originalName = 'myray';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param2;
  }

  public static OWANDY(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'owandy';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  public static PLANMECA(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'romexis';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.imageBasenameLength = Number(parameters?.FormatDossier);
  }

  public static QUICKVISION(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'owandy';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  public static SCANORA(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'scanora';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param1;
  }

  public static SCHICK(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'schick';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  public static SIDEXIS(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'sidexis';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param1;
    imagingSoftware.computerName = imagingSoftware.workstation.name;
  }

  public static SOPRO(imagingSoftware: ImagingSoftwareEntity, parameters: any) {
    imagingSoftware.originalName = 'soproImaging';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  public static TROPHY(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'carestream';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.imageDirname = parameters?.CheminImg;
    imagingSoftware.imageBasenamePrefix = parameters?.lettre;
    imagingSoftware.imageBasenameLength = Number(parameters?.FormatDossier);
  }

  public static VATECH(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'vatech';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  public static VISIODENT(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'visiodent';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param1;
  }
}

export class MACOS {
  /**
   * <SOPROMAC>
   * <CheminExe>/Applications/SOPRO/SOPRO-Imaging.app</CheminExe>
   * </SOPROMAC>
   */
  public static SOPROMAC(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'soproImagingMac';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  /**
   * <VSCAN>
   * <CheminExe>/Applications/HD-IS.app</CheminExe>
   * <Param1>//Users/macrennes/Documents/HD-IS_Exchange/patimport.vcf</Param1>
   * <CheminImg>/Applications/HD-IS.app</CheminImg>
   * </VSCAN>
   */
  public static VSCAN(imagingSoftware: ImagingSoftwareEntity, parameters: any) {
    imagingSoftware.originalName = 'hdis';
    imagingSoftware.executablePath = parameters?.CheminExe;
    imagingSoftware.configurationFilePath = parameters?.Param1;
  }

  /**
   * <PLANMECA>
   * <CheminExe>/Applications/Planmeca/Romexis/pmbridge/./DxStartW</CheminExe>
   * <FormatDossier>6</FormatDossier>
   * </PLANMECA>
   */
  public static PLANMECA(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'romexisMac';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }

  /**
   * <ROMEXIS>
   * <CheminExe>/Applications/Planmeca/Romexis/pmbridge/./DxStartW</CheminExe>
   * <FormatDossier>6</FormatDossier>
   * </ROMEXIS>
   */
  public static ROMEXIS(
    imagingSoftware: ImagingSoftwareEntity,
    parameters: any,
  ) {
    imagingSoftware.originalName = 'romexisMac';
    imagingSoftware.executablePath = parameters?.CheminExe;
  }
}

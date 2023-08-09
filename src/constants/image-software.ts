interface IImageSoftware {
  name?: string;
  executablePath?: string;
  configurationFilePath?: string;
  imageDirname?: string;
  imageBasenamePrefix?: string;
  imageBasenameLength?: number;
  computerName?: string;
}

export const windowPlatform: IImageSoftware[] = [
  {
    name: 'ACTEON IMAGING SUITE',
    executablePath: 'C:/AISsoftware/AISmain/AIS.exe',
  },
  {
    name: 'CARESTREAM',
    executablePath: 'C:/Program Files (x86)/Carestream/CSImaging/TW.exe',
    imageDirname: 'C:/dataRVG',
    imageBasenamePrefix: 'P',
    imageBasenameLength: 6,
  },
  {
    name: 'CLINIVIEW',
    executablePath: 'C:/Program Files (x86)/CLINIVIEW/Cliniview.exe',
    configurationFilePath: 'C:/ProgramData/Cliniview/cliniview.ini',
  },
  {
    name: 'DBSWIN',
    executablePath: 'C:/Program Files (x86)/Duerr/DBSWIN/bin/DBSWIN.exe',
    configurationFilePath: 'C:/ProgramData/Duerr/temp/patimport.txt',
  },
  {
    name: 'DIGORA',
    executablePath: 'C:/Program Files (x86)/Soredex/DfW 2.8/Digora.exe',
  },
  {
    name: 'DTX',
    executablePath: 'C:/Program Files/DTX Studio Clinic/DTXsync.exe',
  },
  {
    name: 'iDIXEL',
    executablePath: 'C:/JMoritaMFG/ToIView/ToiVIEW.exe',
  },
  {
    name: 'MEDIADENT',
    executablePath: 'C:/Program Files (x86)/ImageLevel/Mediadent/Mediadent.exe',
    imageDirname: 'C:/Mediadent/Patients',
    imageBasenameLength: 6,
  },
  {
    name: 'MYRAY',
    executablePath: 'C:/NNT/NNTBridge.exe',
    configurationFilePath: 'C:/NNT/NNT.bat',
  },
  {
    name: 'OWANDY',
    executablePath: 'C:/OWANDY/QuickVision/MjExec.exe',
  },
  {
    name: 'ROMEXIS',
    executablePath:
      'C:/Program Files/Planmeca/Romexis/pmbridge/Program/DxStartW.exe',
    imageBasenameLength: 6,
  },
  {
    name: 'SCANORA',
    executablePath: 'C:/Program Files (x86)/SCANORA/Scanora.exe',
    configurationFilePath: 'C:/ProgramData/Scanora/scanora.ini',
  },
  {
    name: 'SIDEXIS',
    executablePath: 'C:/Program Files/Sirona/SIDEXIS4/Sidexis4.exe',
    configurationFilePath: 'C:/PDATA/siomin.sdx',
    computerName: '',
  },
  {
    name: 'SCHICK',
    executablePath:
      'C:/Program Files (x86)/Schick Technologies/CDR Dicom For Windows/CDRStart.exe',
  },
  {
    name: 'SOPRO IMAGING',
    executablePath: 'C:/Program Files (x86)/Sopro Imaging/SOPRO Imaging.exe',
  },
  {
    name: 'VATECH',
    executablePath:
      'C:/Program Files (x86)/VATECH/EzDent-i/Bin/VTEzDent-iLoader32.exe',
  },
  {
    name: 'VISIODENT',
    executablePath: 'C:/WVISIO32/RSV-Imaging.exe',
    configurationFilePath: 'C:/Windows/Athena.ini',
  },
  {
    name: 'VIXWIN',
    executablePath: 'C:/vixwin/vixwin.exe',
    imageDirname: 'C:/VXIMAGE',
    imageBasenameLength: 6,
  },
];

export const macosPlatform: IImageSoftware[] = [
  {
    name: 'DISMAC',
    executablePath: '/Applications/DIS.app',
    imageDirname: '/Users/Nom_utilisateur/Documents/RVG',
    imageBasenamePrefix: 'P',
    imageBasenameLength: 6,
  },
  {
    name: 'DTX',
    executablePath:
      '/Applications/DTXStudio.app/Contents/Applications/DTXSync.app/Contents/MacOS/DTXSync',
  },
  {
    name: 'HD-IS',
    executablePath: '/Applications/HD-IS.app',
    configurationFilePath: '/Applications/patimport.vcf',
  },
  {
    name: 'ROMEXIS',
    executablePath: '/Applications/HD-IS.app',
    configurationFilePath: '/Applications/Planmeca/Romexis/pmbridge/./DxStartW',
  },
  {
    name: 'SOPRO IMAGING',
    executablePath: '/Applications/SOPRO/SOPRO-Imaging.app',
  },
];

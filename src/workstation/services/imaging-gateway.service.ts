import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { basename, dirname } from 'path';
import { ContactEntity } from 'src/entities/contact.entity';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';
import { UserEntity } from 'src/entities/user.entity';
import { JuxtalinkLaunchService } from './juxtalink-launch.service';

@Injectable()
export class ImagingGatewayService {
  private imagingSoftware: ImagingSoftwareEntity;
  private patient: ContactEntity;
  private practitioner: UserEntity;
  constructor(private juxtalinkLaunchService: JuxtalinkLaunchService) {}

  async getLaunchParameters(
    imagingSoftware: ImagingSoftwareEntity,
    patient: ContactEntity,
    practitioner: UserEntity,
  ) {
    this.imagingSoftware = imagingSoftware;
    this.patient = patient;
    this.practitioner = practitioner;
    return this[imagingSoftware.originalName]();
  }

  async carestream() {
    const imageBasename = this.imagingSoftware.getImageBasename();

    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    // -P{$imagingSoftware->getImageDirname()}\\{$imageBasename} -N{$patient->getLastName()} -F{$patient->getFirstName()}
    const executableParameters = `-P${this.imagingSoftware.imageDirname}\\${imageBasename} -N${this.patient.lastname} -F${this.patient.firstname}`;
    return await this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async acteonImagingSuite() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    // -P{$imagingSoftware->getImageDirname()}\\{$imageBasename} -N{$patient->getLastName()} -F{$patient->getFirstName()}
    const executableParameters = `"${this.patient?.number}" "${
      this.patient?.lastname
    }" "${this.patient?.firstname}" "${dayjs(this.patient?.birthday).format(
      'DD/MM/YYYY',
    )}"`;
    return await this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async cliniview() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = '';
    const configurationFileContents = `[PracticeManagementInterface]
    USE_PRACTICE_MANAGEMENT=1
    PATID=${this.patient?.number}
    PATLNAME=${this.patient?.lastname}
    PATFNAME=${this.patient?.firstname}
    PATBD=${dayjs(this.patient.birthday).format('DD/MM/YYYY')}
    `;
    return await this.juxtalinkLaunchService.makeFileAndCallExe(
      dirname(this.imagingSoftware.configurationFilePath),
      basename(this.imagingSoftware.configurationFilePath),
      configurationFileContents,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async dbswin() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = '';
    const configurationFileContents = `${this.patient?.lastname};${
      this.patient?.firstname
    };${dayjs(this.patient?.birthday).format('DD/MM/YYYY')};${
      this.patient?.number
    };`;

    return await this.juxtalinkLaunchService.makeFileAndCallExe(
      dirname(this.imagingSoftware.configurationFilePath),
      basename(this.imagingSoftware.configurationFilePath),
      configurationFileContents,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async digora() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = '';
    const clipboardText = `$$DFWIN$$ OPEN -n"${this.patient?.lastname} ${this.patient?.firstname}" -c${this.patient?.number} -r`;

    return await this.juxtalinkLaunchService.writeToClipboardAndCallExe(
      clipboardText,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async dismac() {
    const imageBasename =
      this.imagingSoftware.getImageBasename() + this.patient.number;

    const executableDirname = '';
    const executableBasename = 'open';
    // -P{$imagingSoftware->getImageDirname()}\\{$imageBasename} -N{$patient->getLastName()} -F{$patient->getFirstName()}
    const executableParameters = `${this.imagingSoftware.executablePath} --args -P'${this.imagingSoftware.imageDirname} \\${imageBasename}' -N'${this.patient.lastname}' -F'${this.patient?.firstname}'`;
    return await this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async dtx() {
    let gender = 'OTHER';
    if (this.patient?.gender?.code) {
      gender = this.patient.gender.code === 31 ? 'MALE' : 'FEMALE';
    }
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = `-c "UPDATE_CREATE" -r "${
      this.patient.number
    }" -f "${this.patient.firstname}" -l "${this.patient.lastname}" -b "${dayjs(
      this.patient?.birthday,
    ).format('DD/MM/YYYY')}" -g "${gender}"`;

    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async dtxMac() {
    return this.dtx();
  }

  async hdis() {
    const configurationFileDirname = dirname(
      this.imagingSoftware.configurationFilePath,
    );
    const configurationFileBasename = basename(
      this.imagingSoftware.configurationFilePath,
    );
    const configurationFileContents = `BEGIN:VCARD
VERSION:3.0
FN:${this.patient.lastname} ${this.patient.firstname}
N:${this.patient.lastname};${this.patient.firstname}
NOTE:HD-IS_Index :${this.patient.number}
END:VCARD`;
    const executableDirname = '';
    const executableBasename = 'open';
    const executableParameters = this.imagingSoftware.executablePath;

    return this.juxtalinkLaunchService.makeFileAndCallExe(
      configurationFileDirname,
      configurationFileBasename,
      configurationFileContents,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async idixel() {
    let gender = 'OTHER';
    if (this.patient?.gender?.code) {
      gender = this.patient.gender.code === 31 ? 'MALE' : 'FEMALE';
    }
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = `C,${this.patient.number},,,${
      this.patient.firstname
    } ${this.patient.lastname},${gender},${dayjs(this.patient?.birthday).format(
      'DD/MM/YYYY',
    )},`;
    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async mediadent() {
    const imageBasename =
      this.imagingSoftware.imageDirname + this.patient.number;
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.getImageBasename();
    const executableParameters = `/D ${this.practitioner.lastname} ${this.practitioner.firstname} /P ${this.patient.lastname} ${this.patient.firstname} /F ${this.imagingSoftware.imageDirname}/${imageBasename}`;
    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async myray() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = `${this.patient.number} "${
      this.patient.firstname
    }" "${this.patient.lastname}" ${dayjs(this.patient?.birthday).format(
      'DD,MM,YYYY',
    )}`;
    const configurationFileContents = `${this.imagingSoftware.executablePath} /PATID %1 /NAME %2 /SURNAME %3 /DATEB %4`;
    const configurationFileDirname = dirname(
      this.imagingSoftware.configurationFilePath,
    );
    const configurationFileBasename = basename(
      this.imagingSoftware.configurationFilePath,
    );

    return this.juxtalinkLaunchService.makeFileAndCallExe(
      configurationFileDirname,
      configurationFileBasename,
      configurationFileContents,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async owandy() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = `/P:${this.patient.number},${
      this.patient.lastname
    },${this.patient.firstname},,${dayjs(this.patient?.birthday).format(
      'DD-MM-YYYY',
    )}`;
    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async romexis() {
    const imageBasename =
      this.imagingSoftware.imageDirname + this.patient.number;
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = `${imageBasename} "${
      this.patient.lastname
    }" "${this.patient.firstname}" ${dayjs(this.patient?.birthday).format(
      'YYYYMMDD',
    )}`;
    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async romexisMac() {
    return this.romexis();
  }

  async scanora() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = '';
    const configurationFileContents = `[PracticeManagementInterface]
    USE_PRACTICE_MANAGEMENT=1
    PATID=${this.patient?.number}
    PATLNAME=${this.patient?.lastname}
    PATFNAME=${this.patient?.firstname}
    PATBD=${dayjs(this.patient.birthday).format('DD/MM/YYYY')}
    `;
    return await this.juxtalinkLaunchService.makeFileAndCallExe(
      dirname(this.imagingSoftware.configurationFilePath),
      basename(this.imagingSoftware.configurationFilePath),
      configurationFileContents,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async schick() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = `/LastName${this.patient.lastname} /FirstName${this.patient.firstname} /IDNumber${this.patient.number}`;
    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async sidexis() {
    const chr = String.fromCharCode(0);
    const gContent = `${this.patient.lastname}${chr}${
      this.patient.firstname
    }${chr}${dayjs(this.patient.birthday).format('DD/MM/YYYY')}${chr}${
      this.patient.number
    }${chr}`;
    const configurationFileContents1 = `N${chr}${gContent}M${chr}${this.practitioner.lastname}${this.practitioner.firstname}\\\\${this.imagingSoftware.computerName}\\ECOODENTIST${chr}\\\\*\\SIDEXIS${chr} 
`;
    const configurationFileContents2 = `A${chr}${gContent}${
      this.imagingSoftware.computerName
    }${chr}${dayjs().format('DD.MM.YYYY')}${chr}${dayjs().format(
      'HH:mm:ss',
    )}${chr}\\\\${
      this.imagingSoftware.computerName
    }\\ECOODENTIST${chr}\\\\*\\SIDEXIS${chr} 
`;
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = '';
    const configurationFileContents =
      String.fromCharCode(configurationFileContents1.length + 2) +
      chr +
      configurationFileContents1 +
      String.fromCharCode(configurationFileContents2.length + 2) +
      chr +
      configurationFileContents2;

    return await this.juxtalinkLaunchService.makeFileAndCallExe(
      dirname(this.imagingSoftware.configurationFilePath),
      basename(this.imagingSoftware.configurationFilePath),
      configurationFileContents,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async soproImaging() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = `${this.patient.number} "${
      this.patient.firstname
    }" "${this.patient.lastname}" ${dayjs(this.patient.birthday).format(
      'DD/MM/YYYY',
    )}`;
    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async soproImagingMac() {
    const executableDirname = '';
    const executableBasename = 'open';
    const executableParameters = `${
      this.imagingSoftware.executablePath
    } --args ${this.patient.number} "${this.patient.firstname}" "${
      this.patient.lastname
    }" ${dayjs(this.patient.birthday).format('DD/MM/YYYY')}`;
    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async vatech() {
    let gender = 'OTHER';
    if (this.patient?.gender?.code) {
      gender = this.patient.gender.code === 31 ? 'MALE' : 'FEMALE';
    }
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = '';
    const configurationFileContents = `<?xml version="1.0" encoding="utf-8"?>
<LinkageParameter>
<Patient ChartNumber="${this.patient.number}" FirstName="${
      this.patient.firstname
    }" LastName="${this.patient.lastname}">
<Birthday>${dayjs(this.patient.birthday).format('DD/MM/YYYY')}</Birthday>
<Address></Address>
<ZipCode></ZipCode>
<Phone></Phone>
<Mobile></Mobile>
<SocialID></SocialID>
<Gender>${gender}</Gender>
</Patient>
</LinkageParameter>
`;
    return await this.juxtalinkLaunchService.makeFileAndCallExe(
      dirname(this.imagingSoftware.configurationFilePath),
      'Linkage.xml',
      configurationFileContents,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async visiodent() {
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = '';
    const configurationFileContents = `[PATIENT]
Number=${this.patient.number}
Name=${this.patient.lastname}
Birthdate=${dayjs(this.patient.birthday).format('DD/MM/YYYY')}
`;
    return await this.juxtalinkLaunchService.makeFileAndCallExe(
      dirname(this.imagingSoftware.configurationFilePath),
      basename(this.imagingSoftware.configurationFilePath),
      configurationFileContents,
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }

  async vixwin() {
    const imageBasename =
      this.imagingSoftware.getImageBasename() + this.patient.number;
    const executableDirname = '';
    const executableBasename = this.imagingSoftware.executablePath;
    const executableParameters = `-I ${imageBasename} -N "${this.patient.lastname}^${this.patient.firstname}" -P ${this.imagingSoftware.imageDirname}/${imageBasename}`;
    return this.juxtalinkLaunchService.callExecutable(
      executableDirname,
      executableBasename,
      executableParameters,
    );
  }
}

import { Injectable } from '@nestjs/common';
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
}

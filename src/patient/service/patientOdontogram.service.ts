import { Injectable } from '@nestjs/common';
import { DataSource, In, IsNull, MoreThan, Not, Repository } from 'typeorm';
import {
  OdontogramCurrentDto,
  TreatmentPlanOdontogramDto,
} from '../dto/patientBalance.dto';
import { ContactEntity } from 'src/entities/contact.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { LibraryOdontogramEntity } from 'src/entities/library-odontogram.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ShowOdontogramDto, applyStylesDto } from '../dto/odontogram.dto';
import * as path from 'path';
import * as fs from 'fs';
import { DOMParser, XMLSerializer } from 'xmldom';
import { AntecedentPrestationEntity } from 'src/entities/antecedentprestation.entity';
import { checkBoolean, checkId } from 'src/common/util/number';
import { changeSectorNumberToTooth } from 'src/common/util/odontogram';
import { parseJson } from 'src/common/util/json';
import { PatientOdontogramStyleRes } from '../reponse/patientOdontogram.res';

@Injectable()
export class PatientOdontogramService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private dentalEvenTaskRepository: Repository<DentalEventTaskEntity>,
    @InjectRepository(AntecedentPrestationEntity)
    private antecedentPrestationRepository: Repository<AntecedentPrestationEntity>,
    @InjectRepository(LibraryOdontogramEntity)
    private libraryOdontogramRepository: Repository<LibraryOdontogramEntity>,
  ) {}

  #names = ['adult', 'adult_occlusale', 'child', 'child_occlusale', 'charting'];
  #status = ['initial', 'current', 'planned'];

  async getCurrentPrestation(conId: number) {
    return this.eventTaskRepository.find({
      where: {
        conId: conId,
        status: MoreThan(0),
        libraryActId: Not(IsNull()),
        dental: {
          teeth: Not(IsNull()),
        },
      },
      relations: ['dental'],
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async getTreatmentPlanPrestation(conId: number) {
    return this.eventTaskRepository.find({
      where: {
        conId,
        status: 0,
        deletedAt: IsNull(),
        libraryActId: Not(IsNull()),
        dental: {
          teeth: Not(IsNull()) || Not(''),
        },
        event: {
          planEvent: {
            plan: [{ id: IsNull() }, { acceptedOn: Not(IsNull()) }],
          },
        },
      },
      relations: {
        dental: true,
        event: {
          planEvent: {
            plan: true,
          },
        },
      },
      order: {
        date: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async getInitialPrestation(conId: number): Promise<EventTaskEntity[] | null> {
    const result = await this.antecedentPrestationRepository.findOne({
      where: {
        conId,
        teeth: Not(null),
        libraryActId: Not(null),
      },
      select: ['libraryActId', 'libraryActQuantityId', 'teeth'],
      order: {
        createdAt: 'ASC',
      },
    });
    if (!result) return null;
    return [
      {
        libraryActId: result.libraryActId,
        libraryActQuantityId: result.libraryActQuantityId,
        dental: {
          teeth: result.teeth,
          ccamCode: null,
        },
      },
    ];
  }

  async getCurrent(request: OdontogramCurrentDto) {
    try {
      const evenTasks = await this.getCurrentPrestation(request?.patientId);
      return this.odontogramRunStatus(evenTasks);
    } catch (err) {
      console.log('-----data-----', err);
    }
  }

  async getTreatmentPlanOdontogram(request: TreatmentPlanOdontogramDto) {
    try {
      const eventTaskByTreatments = await this.getTreatmentPlanPrestation(
        request?.treatment_plan_id,
      );

      const ids = eventTaskByTreatments?.map((task) => task?.id);
      const evenTasks = await this.eventTaskRepository.find({
        where: {
          id: In(ids),
        },
        relations: ['dental'],
        order: { createdAt: 'ASC' },
      });
      return this.odontogramRunStatus(evenTasks);
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }
  async odontogramRunStatus(evenTasks: EventTaskEntity[]) {
    const applyXRayStyle: string[] = [];
    const applyCrownStyle: string[] = [];
    const applyRootStyle: string[] = [];
    const applyImplantStyle: { teeths: string[]; color: string }[] = [];
    const applyZoneVisibleStyle: {
      teeths: string[];
      zone: string[];
      color: string;
    }[] = [];
    const applyZoneInvisibleStyle: {
      teeths: string[];
      zone: string[];
      color: string;
    }[] = [];
    for (const evenTask of evenTasks) {
      const rgx = new RegExp(`/^HBQK(?!(002))/i`);
      const displayXray = rgx.test(evenTask?.dental?.ccamCode);
      const teethsNumber = evenTask?.dental?.teeth?.split(',');
      const libraryActQuantityId = evenTask?.libraryActQuantityId;
      const libraryActId = evenTask?.libraryActId;

      let library_odontograms = await this.dataSource
        .createQueryBuilder(LibraryOdontogramEntity, 'LO')
        .select()
        .innerJoin('library_act_quantity_odontogram', 'LAQO')
        .where('LO.id = LAQO.library_odontogram_id')
        .andWhere('LAQO.library_act_quantity_id = :libraryActQuantityId', {
          libraryActQuantityId,
        })
        .getMany();

      if (!library_odontograms.length) {
        library_odontograms = await this.dataSource
          .createQueryBuilder(LibraryOdontogramEntity, 'LO')
          .select()
          .innerJoin('library_act_odontogram', 'LAO')
          .where('LO.id = LAO.library_odontogram_id')
          .andWhere('LAO.library_act_id IN (:libraryActId)', { libraryActId })
          .getMany();
      }
      for (const odontogram of library_odontograms) {
        const color = odontogram?.color;
        const visibleCrown = odontogram?.visibleCrown;
        const visibleRoot = odontogram?.visibleRoot;
        const visibleImplant = odontogram?.visibleImplant;
        const visibleAreas = odontogram?.visibleAreas?.split(',');
        const invisibleAreas = odontogram?.invisibleAreas?.split(',');
        const rankOfTooth = odontogram?.rankOfTooth;
        if (rankOfTooth === null) {
          if (displayXray) applyXRayStyle?.push(...teethsNumber);
          if (!!visibleCrown === false) applyCrownStyle?.push(...teethsNumber);
          if (!!visibleRoot == false) applyRootStyle?.push(...teethsNumber);
          if (!!visibleImplant) {
            applyImplantStyle?.push({
              color,
              teeths: [...teethsNumber],
            });
          }
          if (visibleAreas?.length) {
            applyZoneVisibleStyle.push({
              color,
              teeths: [...teethsNumber],
              zone: [...visibleAreas],
            });
          }
          if (invisibleAreas?.length) {
            applyZoneInvisibleStyle.push({
              color: '#ffffff',
              teeths: [...teethsNumber],
              zone: [...invisibleAreas],
            });
          }
        } else if (teethsNumber?.length) {
          const teeth = teethsNumber[rankOfTooth - 1];
          if (displayXray) applyXRayStyle?.push(teeth);
          if (!!visibleCrown === false) applyCrownStyle?.push(teeth);
          if (!!visibleRoot == false) applyRootStyle?.push(teeth);
          if (!!visibleImplant) {
            applyImplantStyle?.push({
              color,
              teeths: [teeth],
            });
          }
          if (visibleAreas?.length) {
            applyZoneVisibleStyle.push({
              color,
              teeths: [teeth],
              zone: [...visibleAreas],
            });
          }
          if (invisibleAreas?.length) {
            applyZoneInvisibleStyle.push({
              color: '#ffffff',
              teeths: [teeth],
              zone: [...invisibleAreas],
            });
          }
        }
      }
    }

    return {
      applyCrownStyle,
      applyImplantStyle,
      applyRootStyle,
      applyXRayStyle,
      applyZoneInvisibleStyle,
      applyZoneVisibleStyle,
    };
  }

  //* ecoophp/application/Services/Contact/Odontogram.php 148 - 182
  /**
   * Récupération des prestations du contact en fonction du status
   * puis application des styles.
   *
   * @param string $status Etat du schéma dentaire.
   */
  async run(
    status: 'planned' | 'current' | 'initial',
    conId: number,
  ): Promise<PatientOdontogramStyleRes | null> {
    let styles: PatientOdontogramStyleRes = {};
    let eventTasks: EventTaskEntity[] = [];
    if (status === 'planned') {
      eventTasks = await this.getTreatmentPlanPrestation(conId);
    }
    if (status === 'current') {
      eventTasks = await this.getCurrentPrestation(conId);
    }
    if (status === 'initial') {
      eventTasks = await this.getInitialPrestation(conId);
    }

    if (eventTasks) {
      for await (const eventTask of eventTasks) {
        const teethsNumber = changeSectorNumberToTooth(
          eventTask?.dental?.teeth,
        );
        const displayXray = /^HBQK(?!(002))/i.test(eventTask?.dental?.ccamCode); // radiographie autre qu'une panoramique

        //* ecoophp/application/Services/Contact/Odontogram.php 148 - 182
        const teethsNumbers = teethsNumber
          .split(/[^\d]/)
          .filter((num) => num !== '');
        let odontograms: LibraryOdontogramEntity[] = [];
        if (eventTask?.libraryActQuantityId) {
          odontograms = await this.findByLibraryActQuantityId(
            eventTask?.libraryActQuantityId,
          );
        }

        if (!odontograms.length) {
          odontograms = await this.findByLibraryActId(eventTask?.libraryActId);
        }
        odontograms;
        if (!odontograms.length) {
          continue;
        }

        // La représentation graphique "Toutes les dents" est prioritaire
        const nullables = odontograms.filter(
          (odontogram) => !odontogram?.rankOfTooth,
        );

        if (nullables.length) {
          odontograms = nullables;
        }

        odontograms.map((odontogram) => {
          const color = parseJson<{ background: string }>(odontogram.color);
          const background = color?.background;
          const visibleCrown = checkBoolean(odontogram.visibleCrown);
          const visibleRoot = checkBoolean(odontogram.visibleRoot);
          const visibleImplant = checkBoolean(odontogram.visibleImplant);
          const visibleAreas = odontogram?.visibleAreas
            ? odontogram.visibleAreas.split(',')
            : [];
          const invisibleAreas = odontogram?.invisibleAreas
            ? odontogram.invisibleAreas.split(',')
            : [];
          const rankOfTooth = odontogram.rankOfTooth;

          if (rankOfTooth && teethsNumbers[rankOfTooth - 1]) {
            const temp = this.applyStyles({
              nums: teethsNumbers[rankOfTooth - 1],
              backgroundColor: background,
              displayCrown: visibleCrown,
              displayRoot: visibleRoot,
              displayImplant: visibleImplant,
              displayXray: displayXray,
              zoneVisibles: visibleAreas,
              zoneInvisibles: invisibleAreas,
            });
            styles = {
              ...styles,
              ...temp,
            };
          } else {
            const temp = this.applyStyles({
              nums: teethsNumber,
              backgroundColor: background,
              displayCrown: visibleCrown,
              displayRoot: visibleRoot,
              displayImplant: visibleImplant,
              displayXray: displayXray,
              zoneVisibles: visibleAreas,
              zoneInvisibles: invisibleAreas,
            });
            styles = {
              ...styles,
              ...temp,
            };
          }
        });
      }
    }
    return Object.keys(styles).length ? styles : null;
  }

  // * ecoophp/application/Services/Contact/Odontogram.php 675- 687
  /**
   * @param string $nums Liste des numéros de dents.
   * @param string $backgroundColor Couleur des zones visibles.
   * @param boolean $displayCrown Couronne visible/invisible.
   * @param boolean $displayRoot Racine visible/invisible.
   * @param boolean $displayImplant Implant visible/invisible.
   * @param boolean $displayXray Radiographie visible/invisible.
   * @param string[] $zoneVisibles Liste des zones visibles.
   * @param string[] $zoneInvisibles Liste des zones invisibles.
   */
  applyStyles({
    nums,
    backgroundColor,
    displayCrown = true,
    displayRoot = true,
    displayImplant,
    displayXray,
    zoneVisibles,
    zoneInvisibles,
  }: applyStylesDto): PatientOdontogramStyleRes {
    const num = nums.split(',');
    const styles: PatientOdontogramStyleRes = {};
    let temp: string | undefined = num[0];

    while (temp) {
      // Affiche ou masque l'icone de radiographie.
      if (displayXray) {
        styles[`"X_${temp}"`] = 'opacity: 1;';
      }

      // Applique le style pour masquer la couronne.
      if (displayCrown) {
        styles[`C_${temp}`] =
          'fill-opacity: 1; fill: #FFF; opacity: 1; stroke: #FFF;';
      }

      // Applique le style pour masquer la racine.
      if (displayRoot) {
        styles[`R_${temp}`] =
          'fill-opacity: 1; fill: #FFF; opacity: 1; stroke: #FFF;';
      }

      // Affiche ou masque l'implant.
      if (displayImplant) {
        styles[
          `I_${temp}`
        ] = `display: block; fill-opacity: 1; fill: ${backgroundColor};`;
      }

      // Affiche les zones visibles.
      if (zoneVisibles) {
        zoneVisibles.forEach((zone) => {
          styles[
            `C_${num}-Z_${zone}`
          ] = `fill-opacity: 1; opacity: 1; fill: ${backgroundColor}; stroke: ${backgroundColor};`;
          styles[
            `R_${num}-Z_${zone}`
          ] = `fill-opacity: 1; opacity: 1; fill: ${backgroundColor}; stroke: ${backgroundColor};`;
        });
      }

      // Affiche les zones invisibles.
      if (zoneInvisibles) {
        zoneInvisibles.forEach((zone) => {
          styles[`C_${num}-Z_${zone}`] =
            'fill: white; fill-opacity: 1; opacity: 1; stroke: white;';
          styles[`R_${num}-Z_${zone}`] =
            'fill: white; fill-opacity: 1; opacity: 1; stroke: white;';
        });
      }
      temp = num.shift();
    }
    return styles;
  }

  /**
   * ecoophp/application/Services/Contact/Odontogram.php 77 - 105
   *
   * Retourne le xml du schéma dentaire en fonction
   * du nom et du status, avec tous les styles appliqués.
   *
   * @return string
   */
  async show(req: ShowOdontogramDto): Promise<string> {
    this.checkOdontogramName(req?.name);
    this.checkStatus(req?.status);
    const styles = await this.run(req?.status, checkId(req?.conId));

    let xml = this.getXml(req?.name);
    for (const key in styles) {
      const style = styles[key];
      const search = [
        new RegExp(`id="${key}" opacity="0"`, 'g'),
        new RegExp(`id="${key}" fill-opacity="0"`, 'g'),
        new RegExp(`id="${key}"`, 'g'),
      ];
      const replace = [
        `id="${key}"`,
        `id="${key}"`,
        `id="${key}" style="${style}"`,
      ];
      for (let i = 0; i < search.length; i++) {
        xml = xml.replace(search[i], replace[i]);
      }
    }
    return xml;
  }

  /**
   *  !ecoophp/application/Services/Odontogram.php
   *
   * Retourne le SVG du schéma dentaire en fonction du nom.
   *
   * @throws InvalidArgumentException Schéma dentaire inexistant.
   * @param string &name Nom du schéma dentaire.
   * @param boolean $hrefToURL Transformation du chemin de l'image en URL.
   * @return string SVG du schéma dentaire
   */
  getXml(name: string, imageToURL?: boolean) {
    const filePath = path.join(process.cwd(), 'svg', `${name}.svg`);
    if (!fs.existsSync(filePath)) {
      throw new CBadRequestException('validation.in ' + name);
    }
    const content: string = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const dom = parser.parseFromString(content, 'image/svg+xml');

    if (imageToURL) {
      const imageNode = dom.getElementsByTagName('image').item(0);
      if (imageNode) {
        const attribute = imageNode.getAttribute('xlink:href');
        imageNode.setAttribute('xlink:href', 'url/' + attribute); // Replace 'url/' with the desired URL path.
      }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(dom);
  }

  checkOdontogramName(name: string) {
    if (this.#names.findIndex((e) => name === e) === -1) {
      throw new CBadRequestException(`Le schéma ${name} n'existe pas.`);
    }
  }

  checkStatus(status: string) {
    if (this.#status.findIndex((e) => e === status) === -1) {
      throw new CBadRequestException(`L'état ${status} n'existe pas.`);
    }
  }

  //ecoophp/application/Repositories/LibraryOdontogramRepository.php 31 -47
  /**
   * Retourne les schémas dentaire d'une quantité d'un acte.
   *
   * @param int $libraryActQuantityId
   * @return array
   */
  async findByLibraryActQuantityId(
    libraryActQuantityId: number,
  ): Promise<LibraryOdontogramEntity[]> {
    return this.libraryOdontogramRepository.find({
      where: {
        libraryActQuantities: {
          id: libraryActQuantityId,
        },
      },
      relations: {
        libraryActQuantities: true,
      },
    });
  }

  //ecoophp/application/Repositories/LibraryOdontogramRepository.php 21-28
  /**
   * Retourne les schémas dentaires d'un acte.
   *
   * @param int $libraryActId
   * @return array
   */
  async findByLibraryActId(
    libraryActId: number,
  ): Promise<LibraryOdontogramEntity[]> {
    return this.libraryOdontogramRepository.find({
      where: {
        libraryActs: {
          id: libraryActId,
        },
      },
      relations: {
        libraryActs: true,
      },
    });
  }
}

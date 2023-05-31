import { Injectable } from '@nestjs/common';
import { FindAllContactDto } from '../dto/findAll.contact.dto';

@Injectable()
export class FindContactService {

  constructor() {}

  /**
   * File: php\contact\findAll.php 21-91
   * @function main function
   * 
   */
  async findAll(request: FindAllContactDto, organizationId: number) {

  }
}

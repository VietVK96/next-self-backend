import { Injectable, Logger } from '@nestjs/common';
import { Command, Positional, Option } from 'nestjs-command';
import { UserService } from 'src/user/services/user.service';

interface BasicCommandOptions {
  noa?: number;
}

@Injectable()
export class CreateAccountCmd {
  private logger = new Logger(CreateAccountCmd.name);
  // constructor(private readonly userService: UserService) {}

  @Command({
    command: 'create:user <noa>',
    describe: 'create a user',
  })
  async run(
    @Positional({
      name: 'noa',
      alias: 'n',
      describe: 'the number of account',
      type: 'number',
    })
    @Positional({
      name: 'password',
      alias: 'p',
      describe: 'password',
      type: 'string',
    })
    noa: number,
    password = 'demoecoo',
  ): Promise<void> {
    const numberOfAccount = noa ?? 500;
    const passwordDefault = password;
    // this.logger.log('Hello World', password);
    // this.userService.add({
    //   noa,
    //   password
    // })
    return;
  }
}

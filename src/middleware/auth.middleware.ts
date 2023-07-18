import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: any, res: any, next: () => void) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = this.jwtService.verify(token);
        req.user = decodedToken; // Lưu thông tin người dùng vào request để sử dụng trong các handler tiếp theo
      } catch (error) {
        // Xử lý lỗi xác thực token (nếu có)
        throw new BadRequestException('Invalid token');
      }
    }

    next();
  }
}

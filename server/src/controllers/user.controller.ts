import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.createUser(req.body, req.user!.userId, req.user!.role);
      res.status(201).json({ success: true, message: 'User created successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.updateUser(req.params.id, req.body, req.user!.userId, req.user!.role);
      res.status(200).json({ success: true, message: 'User updated successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await UserService.deleteUser(req.params.id, req.user!.userId);
      res.status(200).json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

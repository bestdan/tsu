import 'package:test_package/models/user.dart';
import './logger.dart';

class AuthService {
  final Logger _logger = Logger();

  void login(User user) {
    _logger.log('User logged in: ${user.name}');
  }
}

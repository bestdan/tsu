import 'package:test_package/models/user.dart';
import 'package:test_package/services/auth.dart';

void main() {
  final user = User('John');
  final auth = AuthService();
  auth.login(user);
}

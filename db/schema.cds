namespace studentapp;

entity Students {
  key ID         : String(10);
  Name           : String(100);
  Email          : String(100);
  Department     : String(50);
  Year           : Integer;
  Contact        : String(20);
}

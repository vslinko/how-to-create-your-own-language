const a = 1;
const b = 2;

function sum(a, b) {
  return (a + b) * (a + b);
}

if (a > 1) {
  print(1);
}

if (b > 1) {
  print(123);
}

print(sum(a, b) + sum(1, 2));

def perceptron(x1, x2, w1, w2, b):
    s = x1*w1 + x2*w2 + b
    return 1 if s >= 0 else 0
inputs = [(0,0), (0,1), (1,0), (1,1)]
print("AND Gate")
for x1, x2 in inputs:
    print(x1, x2, "->", perceptron(x1, x2, 1, 1, -1.5))
print("\nOR Gate")
for x1, x2 in inputs:
    print(x1, x2, "->", perceptron(x1, x2, 1, 1, -0.5))
print("\nNAND Gate")
for x1, x2 in inputs:
    print(x1, x2, "->", perceptron(x1, x2, -1, -1, 1.5))
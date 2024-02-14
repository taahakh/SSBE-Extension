import torch
device = 0 if torch.cuda.is_available() else -1

print(device)
print(torch.cuda.is_available())
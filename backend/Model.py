import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
import io
from dotenv import load_dotenv
import os
import requests
load_dotenv()

class BottleneckBlock(nn.Module):

  def __init__(self, in_channels, out_channels_middle, out_channels_end, stride=1, downsample=False):
    super().__init__()

    self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels_middle, kernel_size=1, stride=1, padding=0),
            nn.BatchNorm2d(out_channels_middle),
            nn.ReLU(),

            nn.Conv2d(out_channels_middle, out_channels_middle, kernel_size=3, stride=stride, padding=1),
            nn.BatchNorm2d(out_channels_middle),
            nn.ReLU(),

            nn.Conv2d(out_channels_middle, out_channels_end, kernel_size=1, stride=1, padding=0),
            nn.BatchNorm2d(out_channels_end)
        )
    self.downsample = None
    if downsample:
      self.downsample = nn.Sequential(
          nn.Conv2d(in_channels, out_channels_end, kernel_size=1, stride=stride),
          nn.BatchNorm2d(out_channels_end)
      )
    self.relu = nn.ReLU()

  def forward(self, x):
    x_ = x
    result = self.block(x)

    if self.downsample:
        x_ = self.downsample(x)

    result += x_

    return self.relu(result)
  


class MainConvBlock(nn.Module):

    def __init__(self, in_channels, out_channels_middle, out_channels_end, n_blocks, first=False):
        super().__init__()
        if first:
            blocks = [BottleneckBlock(in_channels, out_channels_middle, out_channels_end)]
        else:
            blocks = [BottleneckBlock(in_channels, out_channels_middle, out_channels_end, stride=2, downsample=True)]

        for _ in range(n_blocks-1):
            blocks.append(BottleneckBlock(out_channels_end, out_channels_middle, out_channels_end))

        self.block = nn.Sequential(*blocks)
    def forward(self, x):
        return self.block(x)
    
class ResNet152(nn.Module):

  def __init__(self):
    super().__init__()

    self.conv1 = nn.Conv2d(in_channels=3,
                        out_channels=64,
                        kernel_size=7,
                        padding=3,
                        stride=2
                        )
    self.downSampling = nn.MaxPool2d(3, stride=2)

    self.conv2 = MainConvBlock(64, 64, 256, 3)
    self.conv3 = MainConvBlock(256, 128, 512, 8)
    self.conv4 = MainConvBlock(512, 256, 1024, 36)
    self.conv5 = MainConvBlock(1024, 512, 2048, 3)

    self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
    self.fc = nn.Linear(2048, 1)

    self.full_network = nn.Sequential(
      self.conv1,
      nn.ReLU(),
      self.downSampling,

      self.conv2,
      self.conv3,
      self.conv4,
      self.conv5,

      self.avgpool,
      nn.Flatten(),
      self.fc
    )
  def forward(self, x):
    return self.full_network(x).view(x.size(0))

def download_model(model_file):
    model_url = os.environ["model_url"]
    if not os.path.exists(model_file):
        response = requests.get(model_url, stream=True)
        if response.status_code != 200:
            raise Exception("Failed to download model file.")
        
        with open(model_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)


def predict(image):
    image = Image.open(io.BytesIO(image)).convert("RGB")
    transform = transforms.Compose([
        transforms.Resize((512, 768)),
        transforms.ToTensor()])
    image = transform(image).unsqueeze(0)

    if torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu") 
    model_path = os.environ["model_path"]
    download_model(model_path)
    model = ResNet152().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    with torch.no_grad():
        return model(image.to(device)).item()





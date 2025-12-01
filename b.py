import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as colors
import os

# 1. 파일 경로 설정
current_dir = os.path.dirname(os.path.realpath(__file__))
filename = os.path.join(current_dir, 'pixel_volatility.csv')

try:
    # 2. 데이터 불러오기 및 전치(Transpose)
    data = np.loadtxt(filename, delimiter=',').T
    print(f"최대 변동 횟수: {data.max()}")

except Exception as e:
    print(f"파일을 불러오는 중 오류 발생: {e}")
    exit()

# 3. [첫 번째 그림] 로그 스케일 (전체 분포 확인용) 저장
plt.figure(figsize=(20, 12), dpi=150)
plt.title("r/place 2023 Pixel Volatility (Log Scale)", fontsize=20, fontweight='bold')

im1 = plt.imshow(data, cmap='inferno', norm=colors.LogNorm(vmin=1, vmax=data.max()), extent=[-1500, 1500, 1000, -1000])
plt.colorbar(im1, label='Change Count (Log Scale)')
plt.xlabel("X Coordinate", fontsize=14)
plt.ylabel("Y Coordinate", fontsize=14)

output_path_1 = os.path.join(current_dir, 'volatility_log_scale.png')
plt.savefig(output_path_1, bbox_inches='tight')
print(f"로그 스케일 히트맵 저장 완료: {output_path_1}")
plt.close()

# 4. [두 번째 그림] 격전지 강조 (Threshold > 50) 저장
plt.figure(figsize=(20, 12), dpi=150)
vmax_cutoff = 50 
plt.title(f"r/place 2023 Battlegrounds (Highlight > {vmax_cutoff} changes)", fontsize=20, fontweight='bold')

im2 = plt.imshow(data, cmap='magma', vmin=0, vmax=vmax_cutoff, extent=[-1500, 1500, 1000, -1000])
plt.colorbar(im2, label=f'Change Count (Capped at {vmax_cutoff})')
plt.xlabel("X Coordinate", fontsize=14)
plt.ylabel("Y Coordinate", fontsize=14)

output_path_2 = os.path.join(current_dir, 'volatility_highlight.png')
plt.savefig(output_path_2, bbox_inches='tight')
print(f"격전지 강조 히트맵 저장 완료: {output_path_2}")

plt.close()
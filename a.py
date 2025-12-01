# 1. 라이브러리 임포트, 경로 설정, 상수 정의
import pandas as pd
import numpy as np
import os

script_path = os.path.realpath(__file__)
script_dir = os.path.dirname(script_path)

MAX_W = 3000
MAX_H = 2000
OFFSET_X = 1500
OFFSET_Y = 1000

count_map = np.zeros((MAX_W, MAX_H), dtype=np.int32)
last_color_map = np.full((MAX_W, MAX_H), "EMPTY", dtype=object) 

file_list = sorted([
    f for f in os.listdir(script_dir) 
    if f.startswith("2023_place_canvas_history") and f.endswith(".csv")
])

err_cnt = {'errors': 0, 'chunk_errors': 0}
error_samples = []



# 2. 파일별 데이터 처리
for filename in file_list:
    print(f"{filename} 처리 중...")
    full_path = os.path.join(script_dir, filename)
    file_errors = 0
    
    chunk_size = 500000 # 파일을 50만 행 단위로 나누어 처리 ( RAM 덤프 방지 )
    chunks = pd.read_csv(full_path, chunksize=chunk_size, usecols=['coordinate', 'pixel_color'], dtype={'pixel_color': 'category'})
    
    for i, chunk in enumerate(chunks):
        chunk_orig = chunk.copy()
        chunk = chunk.dropna(subset=['coordinate'])
        
        try:
            clean_coords = chunk['coordinate'].astype(str).replace(r'[^0-9,-]', '', regex=True)
            coords_df = clean_coords.str.split(',', expand=True)
            coords_nums = coords_df.apply(pd.to_numeric, errors='coerce')
            coords_cnt = coords_nums.notna().sum(axis=1)
            
            # --- Case 1: 유저 입력 ---
            user_input = (coords_cnt == 2)
            if user_input.any():
                xs = coords_nums.loc[user_input, 0].astype(int).values + OFFSET_X
                ys = coords_nums.loc[user_input, 1].astype(int).values + OFFSET_Y
                colors = chunk.loc[user_input, 'pixel_color'].values
                
                valid_idx = (xs >= 0) & (xs < MAX_W) & (ys >= 0) & (ys < MAX_H)
                final_xs = xs[valid_idx]
                final_ys = ys[valid_idx]
                final_colors = colors[valid_idx]
                
                for x, y, c in zip(final_xs, final_ys, final_colors):
                    if last_color_map[x, y] != c:
                        count_map[x, y] += 1
                        last_color_map[x, y] = c

            # --- Case 2: 관리자 원형 지우개 도구 ---
            circ_erase = (coords_cnt == 3)
            if circ_erase.any():
                cx = coords_nums.loc[circ_erase, 0].astype(int).values + OFFSET_X
                cy = coords_nums.loc[circ_erase, 1].astype(int).values + OFFSET_Y
                cr = coords_nums.loc[circ_erase, 2].astype(int).values
                colors = chunk.loc[circ_erase, 'pixel_color'].values
                
                for x, y, r, c in zip(cx, cy, cr, colors):
                    x_min, x_max = max(0, x - r), min(MAX_W, x + r + 1)
                    y_min, y_max = max(0, y - r), min(MAX_H, y + r + 1)
                    
                    for ix in range(x_min, x_max):
                        for iy in range(y_min, y_max):
                            if (ix - x)**2 + (iy - y)**2 <= r**2:
                                if last_color_map[ix, iy] != c:
                                    count_map[ix, iy] += 1
                                    last_color_map[ix, iy] = c

            # --- Case 3: 관리자 사각형 지우개 도구 ---
            rect_erase = (coords_cnt == 4)
            if rect_erase.any():
                x1s = coords_nums.loc[rect_erase, 0].astype(int).values + OFFSET_X
                y1s = coords_nums.loc[rect_erase, 1].astype(int).values + OFFSET_Y
                x2s = coords_nums.loc[rect_erase, 2].astype(int).values + OFFSET_X
                y2s = coords_nums.loc[rect_erase, 3].astype(int).values + OFFSET_Y
                colors = chunk.loc[rect_erase, 'pixel_color'].values
                
                for x1, y1, x2, y2, c in zip(x1s, y1s, x2s, y2s, colors):
                    lx, rx = sorted([x1, x2])
                    ly, ry = sorted([y1, y2])
                    lx, rx = max(0, lx), min(MAX_W, rx + 1)
                    ly, ry = max(0, ly), min(MAX_H, ry + 1)
                    
                    current_region = last_color_map[lx:rx, ly:ry]
                    changed_mask = (current_region != c)
                    count_map[lx:rx, ly:ry][changed_mask] += 1
                    last_color_map[lx:rx, ly:ry][changed_mask] = c
            
            # --- Case 4: 에러 ---
            mask_errors = ~(user_input | circ_erase | rect_erase)
            error_cnt = mask_errors.sum()
            
            if error_cnt > 0:
                file_errors += error_cnt
                err_df = chunk_orig[mask_errors].copy()
                err_df['source_file'] = filename
                error_samples.append(err_df)

        except Exception as e:
            print(f"청크 {i} 처리 중 오류 발생: {e}")
            err_cnt['chunk_errors'] += len(chunk)
            continue

    if file_errors > 0:
        print(f"{filename}에서 {file_errors}개의 파싱 오류 발견.")
        err_cnt['errors'] += file_errors



# 3. 최종 결과 출력 및 저장
print("최종 결과")
print("총 파일 수:", len(file_list))
print("총 파싱 오류 수:", err_cnt['errors'])
print("총 청크 처리 오류 수:", err_cnt['chunk_errors'])

output_file = os.path.join(script_dir, "pixel_volatility.csv")
np.savetxt(output_file, count_map, delimiter=",", fmt='%d')
print("픽셀 변동성 데이터 저장 완료:", output_file)

if error_samples:
    error_log_path = os.path.join(script_dir, "error_log.csv")
    pd.concat(error_samples).to_csv(error_log_path, index=False)
    print("오류 로그 저장 완료:", error_log_path)
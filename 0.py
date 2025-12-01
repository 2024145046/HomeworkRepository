import pandas as pd
import os
import glob

current_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = os.path.join(current_dir, "processed_result")
os.makedirs(output_dir, exist_ok=True)
print(" 결과 저장 폴더:", output_dir)

csv_files = glob.glob(os.path.join(current_dir, "*.csv"))

if not csv_files:
    print("현재 폴더에 .csv 파일이 하나도 없습니다.")

else:
    print( f"총 {len(csv_files)}개의 csv 파일을 찾았습니다. 처리 시작합니다...\n" )

    success_count = 0

    for file_path in csv_files:
        try:
            file_name = os.path.basename(file_path)
            df = pd.read_csv(file_path)

            if df.shape[1] >= 4:
                extracted_df = df.iloc[:, [2, 3]]
                save_path = os.path.join(output_dir, file_name)
                extracted_df.to_csv(save_path, index=False, encoding='utf-8-sig')
                print(file_name + " 처리 완료")
                success_count += 1
            else:
                print(file_name + " 처리 과정에서 에러 발생: 열이 4개 미만입니다.")

        except Exception as e:
            print(file_name + " 처리 과정에서 에러 발생:", str(e))

    print(f"\n처리 완료! 총 {success_count}개의 파일이 성공적으로 처리되었습니다.")
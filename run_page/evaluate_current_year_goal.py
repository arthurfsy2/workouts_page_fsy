import json
import numpy as np
from datetime import datetime
from config import JSON_FILE
import os

current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
EVALUATE_JSON_FILE = os.path.join(parent, "src", "static", "evaluate.json")


def read_and_cal_distance(activities):
    # 获取当前年份

    current_year = datetime.now().year

    # 保存该年份的距离数据
    distances = []
    last_year_distances = []

    # 遍历活动，查看每个活动的开始日期是否在当前年份
    for activity in activities:
        start_date = activity["start_date"]
        distance = activity["distance"]

        # 将字符串转换为日期对象
        year = datetime.strptime(start_date, "%Y-%m-%d %H:%M:%S").year

        # 如果活动年份与当前年份相同，则将距离添加到列表中
        if year == latest_year_in_record and activity["type"] == "Ride":
            distances.append(distance)
        if year == second_latest_year_in_record and activity["type"] == "Ride":
            last_year_distances.append(distance)
    # 计算标准差
    if not distances:
        print(f"{latest_year_in_record}年的活动数据为空。")
        total_distances = 0
    if not last_year_distances:
        print(f"{last_year_distances}年的活动数据为空。")
        last_year_total_distances = 0
    total_distances = round(sum(distances) / 1000, 2)

    last_year_total_distances = round(sum(last_year_distances) / 1000, 2)

    return total_distances, last_year_total_distances


def min_days_with_max_effort(
    max_km_per_day,
    current_year_total_distance,
    current_year_avg,
    last_year_total_distance,
    remaining_days,
):
    # 遍历可能的 x 值
    for x in range(1, remaining_days + 1):
        if (
            current_year_total_distance
            + max_km_per_day * x
            + (remaining_days - x) * current_year_avg
            >= last_year_total_distance
        ):
            if x > remaining_days:
                return "无法实现", (max_km_per_day * remaining_days)

            return x, max_km_per_day * x + (remaining_days - x) * current_year_avg

    return "无法实现", (max_km_per_day * remaining_days)
    # 如果没有合适的 x，返回“无法实现”


def total_days_in_year(current_year):
    days = (
        366
        if (
            current_year % 4 == 0
            and (current_year % 100 != 0 or current_year % 400 == 0)
        )
        else 365
    )
    return days


def evaluate_mileage_chance(
    current_year_total_distance: float,
    last_year_total_distance: float,
    max_single_day=100,
    reserved_distance=0,
) -> str:
    today = datetime.now()
    current_year = today.year
    start_of_year = datetime(current_year, 1, 1)

    # 使用 days 属性直接计算天数差
    diff = (today - start_of_year).days
    days_passed = diff + 1  # 加1表示包括当天
    print("days_passed:", days_passed)
    if current_year > latest_year_in_record:
        text = f"{current_year}今年无记录！"
        return text
    if current_year_total_distance > last_year_total_distance:
        text = f"{latest_year_in_record}年当前公里数（{current_year_total_distance} km）已超越{second_latest_year_in_record}年（{last_year_total_distance} km）!"
        return text

    remaining_days = total_days_in_year(current_year) - days_passed

    # current_year_total_distance = current_year_avg * total_days_in_year
    # last_year_total_distance = last_year_avg * 365
    current_year_avg = round(current_year_total_distance / days_passed, 2)

    last_year_avg = round(
        last_year_total_distance / total_days_in_year(second_latest_year_in_record), 2
    )

    # 按日均里程预计今年总数
    projected_distance = round(
        (current_year_avg * total_days_in_year(current_year) + reserved_distance), 2
    )
    shortfall = last_year_total_distance - projected_distance
    daily_increase_needed = shortfall / remaining_days
    reserved_distance_text = (
        f"(已考虑至少额外骑行{reserved_distance} km)" if reserved_distance > 0 else ""
    )

    if projected_distance >= last_year_total_distance:
        if current_year_avg < last_year_avg:
            text = f"问题不大！虽然{latest_year_in_record}年当前日均公里数（{current_year_avg} km）＜ {second_latest_year_in_record}年日均（{last_year_avg} km），但按日均预计总里程（{projected_distance} km）＞{second_latest_year_in_record}年（{last_year_total_distance} km），完成挑战概率很大！{reserved_distance_text}"

        if current_year_avg > last_year_avg:
            text = f"十拿九稳！{latest_year_in_record}年当前日均公里数（{current_year_avg} km）＞ {second_latest_year_in_record}年日均（{last_year_avg} km），且按日均预计总里程（{projected_distance} km）＞ {second_latest_year_in_record}年（{last_year_total_distance} km），完成挑战概率很大！"

    else:
        # 如果按日均无法超越，则尝试计算最小所需极限里程的天数
        x, max_possible_km = min_days_with_max_effort(
            max_single_day,
            current_year_total_distance,
            current_year_avg,
            last_year_total_distance,
            remaining_days,
        )

        if x == "无法实现":
            text = f"罢了！即使在未来 {remaining_days} 天内均极限骑行 {max_single_day} 公里，也无法超越{second_latest_year_in_record}年（{last_year_total_distance} km）的总里程！预计今年极限总里程（{current_year_avg * days_passed + max_possible_km} km）"
            return text

        max_days_percentage = round((x / remaining_days) * 100, 2)
        if max_days_percentage > 0 and max_days_percentage <= 20:
            hard_level = "有点困难！"
        elif max_days_percentage > 20 and max_days_percentage <= 50:
            hard_level = "巨大挑战！"
        elif max_days_percentage > 50:
            hard_level = "要拼命了！"
        text = f"{hard_level}{latest_year_in_record}年当前日均公里数（{current_year_avg} km）＜ {second_latest_year_in_record}年（{last_year_avg} km），且按日均预计总里程（{projected_distance} km）＜ {second_latest_year_in_record}年（{last_year_total_distance} km）"
        text += f"\nPS：如果在未来的 {remaining_days} 天内，至少有 {x} 天 ( {max_days_percentage}% ) 极限骑行 {max_single_day} 公里，可以超越{second_latest_year_in_record}年"

    return text + "\n"


def read_years_list(activities):
    years_set = set()
    for item in activities:
        year = item["start_date_local"].split("-")[0]  # 获取年份
        years_set.add(year)  # 添加到集合
    years_list = sorted(years_set)  # 按年份排序
    return years_list


if __name__ == "__main__":
    # 读取 JSON 文件

    with open(JSON_FILE, "r", encoding="utf-8") as file:
        activities = json.load(file)
    year_lists = read_years_list(activities)
    # print("EVALUATE_JSON_FILE:", EVALUATE_JSON_FILE)
    latest_year_in_record = int(year_lists[-1])
    second_latest_year_in_record = int(year_lists[-2])

    # print(latest_year_in_record, second_latest_year_in_record)
    total_distances, last_year_total_distances = read_and_cal_distance(activities)

    max_distance_single_day = 100
    # reserved_distance = 100 * 6
    reserved_distance = 0
    text = evaluate_mileage_chance(
        total_distances,
        last_year_total_distances,
        max_distance_single_day,
        reserved_distance,
    )
    print(text)
    data = {"text": text}
    with open(EVALUATE_JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

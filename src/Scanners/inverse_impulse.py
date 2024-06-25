import pandas as pd

async def left_check(df: pd.DataFrame, ind: int, order: int) -> bool:
    if ind - order < 0:
        return False

    for i in range(ind - 1, ind - order, -1):
        if df["Close"].iloc[i] < df["Close"].iloc[ind]:
            return False

    return True


async def right_check(df: pd.DataFrame, ind: int, order: int) -> bool:
    if ind + order >= len(df):
        return False

    for i in range(ind + 1, ind + order + 1, 1):
        if df["Close"].iloc[i] <= df["Close"].iloc[ind]:
            return False

    return True


async def deviation(df: pd.DataFrame, left_ind: int, ind: int, right_ind: int) -> bool:

    if (
        df["Close"].iloc[left_ind] >= df["Close"].iloc[right_ind]
        or df["Close"].iloc[left_ind] <= df["Close"].iloc[ind]
        or df["Close"].iloc[right_ind] <= df["Close"].iloc[ind]
    ):
        return False

    first_change = df["High"].iloc[right_ind] - df["Low"].iloc[ind]
    second_change = df["Close"].iloc[left_ind] - df["Close"].iloc[ind]

    if second_change * 100 > first_change * 35:
        return False

    return True


async def get_inverse_impulses(df: pd.DataFrame) -> list:
    result = []
    order = 18

    for i in range(len(df) - 1, -1, -1):
        for j in range(order, 5, -1):
            flag = False
            r_check = await right_check(df, i, j)
            if r_check:
                for k in range(7, 3, -1):
                    l_check = await left_check(df, i, k)
                    if l_check:
                        dev_check = await deviation(df, i - k, i, i + j)
                        if dev_check:
                            flag = True
                            first_ind = df[i : i + j + 1]["High"].idxmax()
                            result.append([i - k, i, first_ind])
                            break
                if flag:
                    break

            if flag:
                i = i + j
                break

    return result

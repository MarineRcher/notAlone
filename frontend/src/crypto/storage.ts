import * as SecureStore from "expo-secure-store";
import { CryptoStorageData, UserKeyPair, GroupKeyInfo } from "./types";

const STORAGE_KEYS = {
	USER_KEY_PAIR: "crypto_user_key_pair",
	GROUP_KEYS: "crypto_group_keys",
	MEMBER_KEYS: "crypto_member_keys"
} as const;

export async function saveUserKeyPair(keyPair: UserKeyPair): Promise<void>
{
	try
	{
		const data = JSON.stringify(keyPair);

		await SecureStore.setItemAsync(STORAGE_KEYS.USER_KEY_PAIR, data);
	}
	catch (error)
	{
		console.error("Failed to save user key pair:", error);
		throw new Error("Storage operation failed");
	}
}

export async function getUserKeyPair(): Promise<UserKeyPair | null>
{
	try
	{
		const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_KEY_PAIR);

		if (!data)
		{
			return null;
		}

		return JSON.parse(data) as UserKeyPair;
	}
	catch (error)
	{
		console.error("Failed to get user key pair:", error);
		return null;
	}
}

export async function saveGroupKey(groupKeyInfo: GroupKeyInfo): Promise<void>
{
	try
	{
		const existingGroups = await getGroupKeys();
		const updatedGroups = {
			...existingGroups,
			[groupKeyInfo.groupId]: groupKeyInfo
		};

		const data = JSON.stringify(updatedGroups);

		await SecureStore.setItemAsync(STORAGE_KEYS.GROUP_KEYS, data);
	}
	catch (error)
	{
		console.error("Failed to save group key:", error);
		throw new Error("Storage operation failed");
	}
}

export async function getGroupKey(
	groupId: string
): Promise<GroupKeyInfo | null>
{
	try
	{
		const groupKeys = await getGroupKeys();

		return groupKeys[groupId] || null;
	}
	catch (error)
	{
		console.error("Failed to get group key:", error);
		return null;
	}
}

export async function getGroupKeys(): Promise<Record<string, GroupKeyInfo>>
{
	try
	{
		const data = await SecureStore.getItemAsync(STORAGE_KEYS.GROUP_KEYS);

		if (!data)
		{
			return {};
		}

		return JSON.parse(data) as Record<string, GroupKeyInfo>;
	}
	catch (error)
	{
		console.error("Failed to get group keys:", error);
		return {};
	}
}

export async function deleteGroupKey(groupId: string): Promise<void>
{
	try
	{
		const groupKeys = await getGroupKeys();

		delete groupKeys[groupId];

		const data = JSON.stringify(groupKeys);

		await SecureStore.setItemAsync(STORAGE_KEYS.GROUP_KEYS, data);
	}
	catch (error)
	{
		console.error("Failed to delete group key:", error);
		throw new Error("Storage operation failed");
	}
}

export async function saveMemberKey(
	groupId: string,
	userId: string,
	publicKey: string
): Promise<void>
{
	try
	{
		const memberKeys = await getMemberKeys();

		if (!memberKeys[groupId])
		{
			memberKeys[groupId] = {};
		}

		memberKeys[groupId][userId] = publicKey;

		const data = JSON.stringify(memberKeys);

		await SecureStore.setItemAsync(STORAGE_KEYS.MEMBER_KEYS, data);
	}
	catch (error)
	{
		console.error("Failed to save member key:", error);
		throw new Error("Storage operation failed");
	}
}

export async function getMemberKeys(): Promise<
	Record<string, Record<string, string>>
	>
{
	try
	{
		const data = await SecureStore.getItemAsync(STORAGE_KEYS.MEMBER_KEYS);

		if (!data)
		{
			return {};
		}

		return JSON.parse(data) as Record<string, Record<string, string>>;
	}
	catch (error)
	{
		console.error("Failed to get member keys:", error);
		return {};
	}
}

export async function clearAllCryptoData(): Promise<void>
{
	try
	{
		await Promise.all([
			SecureStore.deleteItemAsync(STORAGE_KEYS.USER_KEY_PAIR),
			SecureStore.deleteItemAsync(STORAGE_KEYS.GROUP_KEYS),
			SecureStore.deleteItemAsync(STORAGE_KEYS.MEMBER_KEYS)
		]);
	}
	catch (error)
	{
		console.error("Failed to clear crypto data:", error);
		throw new Error("Storage operation failed");
	}
}

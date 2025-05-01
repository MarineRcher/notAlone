import axios from "axios";
import crypto from "crypto";

const isPasswordCompromised = async (password: string) => {
    const hash = crypto
        .createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await axios.get(
        `https://api.pwnedpasswords.com/range/${prefix}`
    );
    return response.data.includes(suffix);
};
export default isPasswordCompromised;

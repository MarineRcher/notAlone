import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";
import AddictionUser from "../../models/AddictionUser";
import logger from "../../config/logger";
import User from "../../models/User";

/**
 * Validates the input data for associating an addiction with a user.
 *
 * Ensures all required fields are present and correctly formatted:
 * - `addiction_id` must be a valid number
 * - `date` must be a valid ISO8601 date string
 * - `use_a_day` and `spending_a_day`, if provided, must be numbers
 *
 * @param {number} addiction_id - The ID of the addiction to associate.
 * @param {string} date - The start date of the addiction (ISO8601 format).
 * @param {number} [use_a_day] - Optional daily usage frequency.
 * @param {number} [spending_a_day] - Optional daily spending amount.
 * @returns {{ isValid: boolean; errors: { [key: string]: string } }}
 * An object indicating whether the input is valid and any corresponding error messages.
 */
const validateAddictionData = (
	addiction_id: string,
	date: string,
	use_a_day?: number,
	spending_a_day?: number,
) => {
	const errors: {
		addiction_id?: string;
		date?: string;
		use_a_day?: string;
		spending_a_day?: string;
	} = {};

	if (!date || !Date.parse(date)) {
		errors.date = "Format de date invalide (utilisez ISO8601)";
	}

	if (use_a_day !== undefined && isNaN(use_a_day)) {
		errors.use_a_day = "Nombre d'utilisations invalide";
	}

	if (spending_a_day !== undefined && isNaN(spending_a_day)) {
		errors.spending_a_day = "Montant dépensé invalide";
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
};

/**
 * Express controller for associating an addiction with a user.
 *
 * Performs several checks before creating the user-addiction relationship:
 * - Validates input data
 * - Confirms user and addiction existence
 * - Prevents duplicate entries
 * - Enforces premium account limits
 *
 * Sends appropriate HTTP responses:
 * - 201 Created if successful
 * - 400 Bad Request if data is invalid
 * - 401 Unauthorized if user is not authenticated
 * - 403 Forbidden if premium restrictions apply
 * - 404 Not Found if user or addiction does not exist
 * - 409 Conflict if the addiction is already linked to the user
 *
 * Logs successful operations and errors using the logger.
 *
 * @param {Request} req - Express request object. Requires authenticated user (`req.user`).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when processing is complete.
 */
export const addUserAddiction = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const user_id = req.user?.id;

		if (!user_id) {
			res.status(401).json({ message: "Non autorisé" });
			return;
		}

		const { addiction_id, date, use_a_day, spending_a_day } = req.body;

		// Validation des données
		const { isValid, errors } = validateAddictionData(
			addiction_id,
			date,
			use_a_day,
			spending_a_day,
		);

		if (!isValid) {
			res.status(400).json({
				message: "Données invalides",
				errors,
			});
			return;
		}

		// Vérification de l'existence de l'utilisateur
		const user = await User.findByPk(user_id);
		if (!user) {
			res.status(404).json({
				message: "Utilisateur introuvable",
			});
			return;
		}

		// Vérification de l'existence de l'addiction
		const addictionExists = await Addiction.findByPk(addiction_id);
		if (!addictionExists) {
			res.status(404).json({
				message: "Addiction introuvable",
			});
			return;
		}

		// Vérification si l'addiction existe déjà
		const existingAddiction = await AddictionUser.findOne({
			where: {
				id_user: user_id,
				id_addiction: addiction_id,
			},
		});

		if (existingAddiction) {
			res.status(409).json({
				message: "Vous avez déjà ajouté cette addiction",
			});
			return;
		}

		// Vérification des limites premium
		const userAddictionsCount = await AddictionUser.count({
			where: { id_user: user_id },
		});

		if (userAddictionsCount > 0 && !user.hasPremium) {
			res.status(403).json({
				message: "Compte premium requis pour ajouter plusieurs addictions",
			});
			return;
		}

		// Création de la relation
		await AddictionUser.create({
			id_addiction: addiction_id,
			id_user: user_id,
			date: new Date(date),
			spending_a_day,
			use_a_day,
		});

		logger.info("Addiction ajoutée avec succès", {
			user: user_id,
			addiction: addiction_id,
			ip: req.ip,
		});

		res.status(201).json({
			message: "Addiction ajoutée avec succès",
		});
	} catch (error) {
		logger.error("Erreur lors de l'ajout d'une addiction", {
			error,
			user_id: req.user?.id,
			ip: req.ip,
		});

		if (error instanceof Error) {
			if ("name" in error && error.name === "SequelizeUniqueConstraintError") {
				res.status(409).json({
					message: "Cette addiction est déjà associée à votre compte",
				});
				return;
			}

			if (
				"name" in error &&
				error.name === "SequelizeForeignKeyConstraintError"
			) {
				res.status(404).json({
					message: "Addiction introuvable",
				});
				return;
			}
		}

		next(error);
	}
};

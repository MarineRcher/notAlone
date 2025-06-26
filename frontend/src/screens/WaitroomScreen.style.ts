import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 60,
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  title: {
    fontSize: 24,
    fontFamily: Fonts.quicksand.bold,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.quicksand.regular,
    color: colors.secondary,
    textAlign: 'center',
  },

  waitroomContainer: {
    flex: 1,
    backgroundColor: colors.secondary + '20',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusText: {
    fontSize: 18,
    fontFamily: Fonts.quicksand.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },

  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },

  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.quicksand.regular,
    color: colors.text,
  },

  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },

  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.secondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  progressText: {
    fontSize: 14,
    fontFamily: Fonts.quicksand.bold,
    color: colors.text,
  },

  usersContainer: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },

  usersTitle: {
    fontSize: 16,
    fontFamily: Fonts.quicksand.bold,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },

  userItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary + '20',
    borderRadius: 8,
    marginBottom: 8,
  },

  userText: {
    fontSize: 14,
    fontFamily: Fonts.quicksand.regular,
    color: colors.text,
    textAlign: 'center',
  },

  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },

  infoText: {
    fontSize: 14,
    fontFamily: Fonts.quicksand.regular,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },

  helpText: {
    fontSize: 12,
    fontFamily: Fonts.quicksand.regular,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  cancelButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },

  cancelButtonText: {
    fontSize: 16,
    fontFamily: Fonts.quicksand.bold,
    color: colors.background,
    textAlign: 'center',
  },
});

export default styles; 
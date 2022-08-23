import * as _ from "lodash";
import * as changeCase from "change-case";
import * as mkdirp from "mkdirp";
import * as path from "path";

import {
  commands,
  ExtensionContext,
  InputBoxOptions,
  OpenDialogOptions,
  QuickPickOptions,
  Uri,
  window,
} from "vscode";
import { existsSync, lstatSync, writeFile, appendFile } from "fs";
import {
  getCubitStateTemplate,
  getCubitTemplate,
  getUseCaseTemplate,
  
} from "./templates";
import { analyzeDependencies } from "./utils";
import { getOutputPortTemplate } from "./templates/output-port.template";
import { getInputPortTemplate } from "./templates/input-port.template";
import { getModuleTemplate } from "./templates/module.template";
import { getFactoryTemplate } from "./templates/factory.template";
import { getRouteTemplate } from "./templates/route.template";
import { getRepositoryTemplate } from "./templates/repository.template";
import { getPresenterTemplate } from "./templates/presenter.template";
import { getDirectionTemplate } from "./templates/direction.template";
import { getScreenTemplate } from "./templates/screen.template";

export function activate (_context: ExtensionContext) {
  analyzeDependencies();

 
  commands.registerCommand("prouser.arch", async (uri: Uri) => {
    Go(uri);
  });
}

export async function Go (uri: Uri) {
  // Show feature prompt
  let featureName = await promptForFeatureName();

  // Abort if name is not valid
  if (!isNameValid(featureName)) {
    window.showErrorMessage("The name must not be empty");
    return;
  }
  featureName = `${featureName}`;

  let targetDirectory = "";
  try {
    targetDirectory = await getTargetDirectory(uri);
  } catch (error) {
    window.showErrorMessage("cannot get the target directory");
  }

  const useEquatable = true;

  const pascalCaseFeatureName = changeCase.pascalCase(
    featureName.toLowerCase()
  );
  try {
    await generateFeatureArchitecture(
      `${featureName}`,
      targetDirectory,
      useEquatable,
    );
    //generateCubitCode('${featureName}', targetDirectory, true);
    window.showInformationMessage(
      `Successfully Generated ${pascalCaseFeatureName} Feature`
    );
  } catch (error) {
    window.showErrorMessage(
      `Error:
        ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }
}





export function isNameValid (featureName: string | undefined): boolean {
  // Check if feature name exists
  if (!featureName) {
    return false;
  }
  // Check if feature name is null or white space
  if (_.isNil(featureName) || featureName.trim() === "") {
    return false;
  }

  // Return true if feature name is valid
  return true;
}

export async function getTargetDirectory (uri: Uri): Promise<string> {
  let targetDirectory;
  if (_.isNil(_.get(uri, "fsPath")) || !lstatSync(uri.fsPath).isDirectory()) {
    targetDirectory = await promptForTargetDirectory();
    if (_.isNil(targetDirectory)) {
      throw Error("Please select a valid directory");
    }
  } else {
    targetDirectory = uri.fsPath;
  }

  return targetDirectory;
}

export async function promptForTargetDirectory (): Promise<string | undefined> {
  const options: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select a folder to create the feature in",
    canSelectFolders: true,
  };

  return window.showOpenDialog(options).then((uri) => {
    if (_.isNil(uri) || _.isEmpty(uri)) {
      return undefined;
    }
    return uri[0].fsPath;
  });
}

export function promptForFeatureName (): Thenable<string | undefined> {
  const blocNamePromptOptions: InputBoxOptions = {
    prompt: "Feature Name",
    placeHolder: "counter",
  };
  return window.showInputBox(blocNamePromptOptions);
}

export async function promptForUseEquatable (): Promise<boolean> {
  const useEquatablePromptValues: string[] = ["no (default)", "yes (advanced)"];
  const useEquatablePromptOptions: QuickPickOptions = {
    placeHolder:
      "Do you want to use the Equatable Package in bloc to override equality comparisons?",
    canPickMany: false,
  };

  const answer = await window.showQuickPick(
    useEquatablePromptValues,
    useEquatablePromptOptions
  );

  return answer === "yes (advanced)";
}





async function generateInputPortCode(
  name: string,
  targetDirectory: string
){
  const inputPortDirectoryPath = `${targetDirectory}/input_ports`;
  if (!existsSync(inputPortDirectoryPath)) {
    await createDirectory(inputPortDirectoryPath);
  }

  await Promise.all([
    createInputPortTemplate(name, targetDirectory,)
  ]);
}

async function generateOutputPortCode(
  name: string,
  targetDirectory: string
){
  const directoryPath = `${targetDirectory}/output_ports`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createOutputPortTemplate(name, targetDirectory,)
  ]);
}

async function generateUseCaseCode(
  name: string,
  targetDirectory: string
){
  const directoryPath = `${targetDirectory}`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createUseCaseTemplate(name, targetDirectory,)
  ]);
}

async function generateCubitCode (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean
) {
  const cubityDirectoryPath = `${targetDirectory}/cubits`;
  const stateDirectoryPath = `${targetDirectory}/states`;
  if (!existsSync(cubityDirectoryPath)) {
    await createDirectory(cubityDirectoryPath);
  }
  if (!existsSync(stateDirectoryPath)) {
    await createDirectory(stateDirectoryPath);
  }

  await Promise.all([
    createCubitStateTemplate(blocName, targetDirectory, useEquatable),
    createCubitTemplate(blocName, targetDirectory, useEquatable),
  ]);
}

async function generateLocatorCode (
  name: string,
  targetDirectory: string,
) {
  const directoryPath = `${targetDirectory}`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createLocatorTemplate(name, targetDirectory)
  ]);
}

async function generateFactoryCode (
  name: string,
  targetDirectory: string,
) {
  const directoryPath = `${targetDirectory}/factories`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createFactoryTemplate(name, targetDirectory)
  ]);
}

async function generateRepositoryCode (
  name: string,
  targetDirectory: string,
) {
  const directoryPath = `${targetDirectory}/repositories`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createRepositoryTemplate(name, targetDirectory)
  ]);
}

async function generateRouteCode (
  name: string,
  targetDirectory: string,
) {
  const directoryPath = `${targetDirectory}/routes`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createRouteTemplate(name, targetDirectory)
  ]);
}

async function generateDirectionCode (
  name: string,
  targetDirectory: string,
) {
  const directoryPath = `${targetDirectory}/directions`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createDirectionsTemplate(name, targetDirectory)
  ]);
}

async function generatePresenterCode (
  name: string,
  targetDirectory: string,
) {
  const directoryPath = `${targetDirectory}/presenters`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createPresenterTemplate(name, targetDirectory)
  ]);
}

async function generateScreenCode (
  name: string,
  targetDirectory: string,
) {
  const directoryPath = `${targetDirectory}/screens`;
  if (!existsSync(directoryPath)) {
    await createDirectory(directoryPath);
  }

  await Promise.all([
    createScreenTemplate(name, targetDirectory)
  ]);
}







export async function generateFeatureArchitecture (
  featureName: string,
  targetDirectory: string,
  useEquatable: boolean,
) {
  // Create the features directory if its does not exist yet
  const featuresDirectoryPath = getFeaturesDirectoryPath(targetDirectory);
  if (!existsSync(featuresDirectoryPath)) {
    await createDirectory(featuresDirectoryPath);
  }

  // Create the feature directory
  const featureDirectoryPath = path.join(featuresDirectoryPath, featureName);
  await createDirectory(featureDirectoryPath);

  // Create the infra layer
  const infraDirectoryPath = path.join(featureDirectoryPath, "infra");
  await createDirectories(infraDirectoryPath, [
    "datasources",
    "entities",
    "repositories",
  ]);

  // Create the domain layer
  const domainDirectoryPath = path.join(featureDirectoryPath, "domain");
  await createDirectories(domainDirectoryPath, [
    "models",
    
  ]);

    // Create the useCase layer
    const useCaseDirectoryPath = path.join(featureDirectoryPath, "usecases");

  // Create the locator layer
  const locatorDirectoryPath = path.join(featureDirectoryPath, "locator");
    

  //create ports
  const portsDirectoryPath = path.join(featureDirectoryPath, "ports");
  await createDirectories(portsDirectoryPath, [
    "input_ports",
    "output_ports",
    
  ]);

   //create navigation
   const navigationDirectoryPath = path.join(featureDirectoryPath, "navigation");
   await createDirectories(navigationDirectoryPath, [
     "directions",
     "routes",
     
   ]);

  // Create the presentation layer
  const presentationDirectoryPath = path.join(
    featureDirectoryPath,
    "presentation"
  );
  await createDirectories(presentationDirectoryPath, [
    "factories",
    "states",
  ]);

   // Create the ui layer
   const uiDirectoryPath = path.join(
    featureDirectoryPath,
    "ui"
  );
  await createDirectories(uiDirectoryPath, [
    "screens",
    "widgets",
    "presenters",
  ]);

  //domain
  //infra
  await generateRepositoryCode(featureName, infraDirectoryPath);
  //locator
  await generateLocatorCode(featureName, locatorDirectoryPath);
  //navigation
  await generateRouteCode(featureName, navigationDirectoryPath);
  await generateDirectionCode(featureName, navigationDirectoryPath);
  //ports
  await generateInputPortCode(featureName, portsDirectoryPath);
  await generateOutputPortCode(featureName, portsDirectoryPath);
  //presentation
  await generateCubitCode(featureName, presentationDirectoryPath, useEquatable);
  await generateFactoryCode(featureName, presentationDirectoryPath);
  //ui
  await generateScreenCode(featureName, uiDirectoryPath);
  await generatePresenterCode(featureName, uiDirectoryPath);
  //usecases
  await generateUseCaseCode(featureName, useCaseDirectoryPath);

}

export function getFeaturesDirectoryPath (currentDirectory: string): string {
  // Split the path
  const splitPath = currentDirectory.split(path.sep);

  // Remove trailing \
  if (splitPath[splitPath.length - 1] === "") {
    splitPath.pop();
  }

  // Rebuild path
  const result = splitPath.join(path.sep);

  // Determines whether we're already in the features directory or not
  const isDirectoryAlreadyFeatures =
    splitPath[splitPath.length - 1] === "modules";

  // If already return the current directory if not, return the current directory with the /features append to it
  return isDirectoryAlreadyFeatures ? result : path.join(result, "modules");
}

export async function createDirectories (
  targetDirectory: string,
  childDirectories: string[]
): Promise<void> {
  // Create the parent directory
  await createDirectory(targetDirectory);
  // Creat the children
  childDirectories.map(
    async (directory) =>
      await createDirectory(path.join(targetDirectory, directory))
  );
}

function createDirectory (targetDirectory: string) {
  mkdirp(targetDirectory, );
}



//create templates

function createCubitStateTemplate (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/states/${snakeCaseBlocName}_state.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_state.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getCubitStateTemplate(blocName, useEquatable),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createCubitTemplate (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/cubits/${snakeCaseBlocName}_cubit.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_cubit.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getCubitTemplate(blocName, useEquatable),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createInputPortTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/input_ports/${snakeCaseName}_input_port.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_input_port.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getInputPortTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createOutputPortTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/output_ports/${snakeCaseName}_output_port.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_output_port.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getOutputPortTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createUseCaseTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/${snakeCaseName}_usecase.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_usecase.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getUseCaseTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createLocatorTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/${snakeCaseName}_module.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_module.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getModuleTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createFactoryTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/factories/${snakeCaseName}_presenter_factory.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_presenter_factory.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getFactoryTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createRouteTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/routes/${snakeCaseName}_route.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_route.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getRouteTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createRepositoryTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/repositories/${snakeCaseName}_repository.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_repository.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getRepositoryTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createPresenterTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/presenters/${snakeCaseName}_presenter.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_presenter.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getPresenterTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createDirectionsTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/directions/${snakeCaseName}_direction.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_direction.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getDirectionTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createScreenTemplate (
  name: string,
  targetDirectory: string,
) {
  const snakeCaseName = changeCase.snakeCase(name.toLowerCase());
  const targetPath = `${targetDirectory}/screens/${snakeCaseName}_screen.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseName}_screen.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getScreenTemplate(name),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

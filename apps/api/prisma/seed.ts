import { PrismaClient, PrivilegeGroup, RoleType } from "@prisma/client";
const prisma = new PrismaClient();

const DEFAULT_PRIVILEGES = [
  // User Management
  {
    privilegeName: "user:create",
    description: "Can create users",
    privilegeGroup: PrivilegeGroup.USER_MANAGEMENT,
  },
  {
    privilegeName: "user:read",
    description: "Can view user details",
    privilegeGroup: PrivilegeGroup.USER_MANAGEMENT,
  },
  {
    privilegeName: "user:update",
    description: "Can update user details",
    privilegeGroup: PrivilegeGroup.USER_MANAGEMENT,
  },
  {
    privilegeName: "user:delete",
    description: "Can delete users",
    privilegeGroup: PrivilegeGroup.USER_MANAGEMENT,
  },

  // Profile Management
  {
    privilegeName: "profile:read",
    description: "Can view profiles",
    privilegeGroup: PrivilegeGroup.PROFILE,
  },
  {
    privilegeName: "profile:update",
    description: "Can update profiles",
    privilegeGroup: PrivilegeGroup.PROFILE,
  },

  // Role Management
  {
    privilegeName: "role:create",
    description: "Can create roles",
    privilegeGroup: PrivilegeGroup.ROLE_MANAGEMENT,
  },
  {
    privilegeName: "role:read",
    description: "Can view roles",
    privilegeGroup: PrivilegeGroup.ROLE_MANAGEMENT,
  },
  {
    privilegeName: "role:update",
    description: "Can update roles",
    privilegeGroup: PrivilegeGroup.ROLE_MANAGEMENT,
  },
  {
    privilegeName: "role:delete",
    description: "Can delete roles",
    privilegeGroup: PrivilegeGroup.ROLE_MANAGEMENT,
  },

  // Settings
  {
    privilegeName: "settings:read",
    description: "Can view settings",
    privilegeGroup: PrivilegeGroup.SETTINGS,
  },
  {
    privilegeName: "settings:update",
    description: "Can update settings",
    privilegeGroup: PrivilegeGroup.SETTINGS,
  },

  // System
  {
    privilegeName: "system:manage",
    description: "Can manage system configurations",
    privilegeGroup: PrivilegeGroup.SYSTEM,
  },
];

const DEFAULT_ROLES = [
  {
    name: "SUPER_ADMIN",
    description: "Full system access",
    roleType: RoleType.SYSTEM,
    isDefault: false,
  },
  {
    name: "ADMIN",
    description: "Administrative access with limitations",
    roleType: RoleType.SYSTEM,
    isDefault: false,
  },
  {
    name: "USER",
    description: "Standard user access",
    roleType: RoleType.SYSTEM,
    isDefault: true,
  },
];

const ROLE_PRIVILEGES_MAP = {
  SUPER_ADMIN: DEFAULT_PRIVILEGES.map((p) => p.privilegeName),
  ADMIN: [
    "user:read",
    "user:update",
    "profile:read",
    "profile:update",
    "role:read",
    "settings:read",
  ],
  USER: ["profile:read", "profile:update"],
};

async function main() {
  console.log("Starting seeding process...");

  // Create Privileges
  console.log("Creating privileges...");
  const privileges = await Promise.all(
    DEFAULT_PRIVILEGES.map((privilege) =>
      prisma.privilege.upsert({
        where: { privilegeName: privilege.privilegeName },
        update: privilege,
        create: privilege,
      }),
    ),
  );

  // Create Roles
  console.log("Creating roles...");
  for (const role of DEFAULT_ROLES) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });

    // Assign privileges to role
    const rolePrivileges =
      ROLE_PRIVILEGES_MAP[role.name as keyof typeof ROLE_PRIVILEGES_MAP];
    if (rolePrivileges) {
      console.log(`Assigning privileges to ${role.name}...`);

      // Delete existing role privileges
      await prisma.rolePrivilege.deleteMany({
        where: { roleId: createdRole.id },
      });

      // Create new role privileges
      for (const privilegeName of rolePrivileges) {
        const privilege = privileges.find(
          (p) => p.privilegeName === privilegeName,
        );
        if (privilege) {
          await prisma.rolePrivilege.create({
            data: {
              roleId: createdRole.id,
              privilegeId: privilege.id,
            },
          });
        }
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
